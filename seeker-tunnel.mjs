#!/usr/bin/env node
// seeker-tunnel: the local proxy for the hosted seeker MCP server.
// To the agent it is an MCP server on stdio; to the server, one WebSocket. It copies JSON-RPC
// lines both ways, opens TCP connections the server asks for (only to whitelisted host:port)
// and files (only at paths the agent itself passed in a tools/call), and copies their bytes.
// It knows no tools and no game. Without a key it signs you in first (Sign-in, below).
// Node's standard library only. Logs go to stderr: stdout is the MCP stream.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

const VERSION = '0.1.0-alpha';
const SERVER = `wss://seeker.sohpea.dev/v${VERSION}/`; // this release's server
const T = { mcp: 1, mcpPart: 2, open: 3, fopen: 4, opened: 5, error: 6, data: 7, close: 8, credit: 9, ping: 10, pong: 11 };
const MiB = 1 << 20;
const FRAME_MAX = MiB; // largest data frame, and the size of mcp-part pieces
const MAX_STREAMS = 4;
const WINDOW_IN = 16 * MiB; // what the server may send on a stream beyond the credit we gave (4 streams: 64 MiB)
const WINDOW_OUT = MiB; // what we may send on a stream before the server gives credit
const CREDIT_STEP = MiB; // we give credit back in steps of at least this much
const REINIT = 'seeker-tunnel-reinit-';
const USAGE = `seeker-tunnel ${VERSION}: local proxy for the hosted seeker MCP server.
  node seeker-tunnel.mjs [options]   the MCP server on stdio (your agent starts it)
  node seeker-tunnel.mjs login       sign in with GitHub and save your key (npm run login)
  node seeker-tunnel.mjs logout      delete the saved key (npm run logout)
Options:
  --allow host:port,...   where the server may open TCP connections; "*" for any port
                          (default 127.0.0.1:*; giving --allow replaces the default)
  --max-write-mb N        largest file the server may write (default 64)
  --version, --help
Environment:
  SEEKER_MODE, SEEKER_HELP   passed to the server as they are
  SEEKER_PORT             the game server port connect uses when the agent names none
  SEEKER_API_KEY          an API key, used instead of the saved one
  SEEKER_TUNNEL_URL, SEEKER_AUTH_URL   another server, for development and testing only
`;

const log = (m) => process.stderr.write(`seeker-tunnel: ${m}\n`);
const die = (m) => { log(m); process.exit(1); };

let allowList = null, maxWrite = 64 * MiB, command = 'serve';
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const [, a, inline] = /^([^=]*)(?:=(.*))?$/s.exec(argv[i]);
  const value = () => inline ?? argv[++i] ?? die(`${a} needs a value`);
  if (a === '--allow') allowList = [...(allowList || []), ...value().split(',').map((e) => e.trim()).filter(Boolean)];
  else if (a === '--max-write-mb') maxWrite = Number(value()) * MiB;
  else if (a === '--version') { process.stdout.write(`${VERSION}\n`); process.exit(0); }
  else if (a === '--help' || a === '-h') { process.stdout.write(USAGE); process.exit(0); }
  else if ((a === 'login' || a === 'logout') && command === 'serve') command = a;
  else die(`unknown argument ${argv[i]}\n${USAGE}`);
}
if (!(maxWrite >= 0)) die('--max-write-mb needs a number');
const PORT = process.env.SEEKER_PORT;
if (PORT && command === 'serve' && !(/^\d{1,5}$/.test(PORT) && +PORT >= 1 && +PORT <= 65535)) die(`SEEKER_PORT is "${PORT}": it must be a port number from 1 to 65535`);
const rules = (allowList || ['127.0.0.1:*']).map((e) => {
  const m = /^\[?(.+?)\]?:(\*|\d{1,5})$/.exec(e);
  if (!m || (m[2] !== '*' && !(+m[2] >= 1 && +m[2] <= 65535))) die(`bad --allow entry "${e}": use host:port or host:*`);
  return { host: m[1].toLowerCase(), port: m[2] === '*' ? '*' : +m[2] };
});
const allowed = (host, port) => rules.some((r) => r.host === host.toLowerCase() && (r.port === '*' || r.port === port));

// Files: <config>/seeker-tunnel/ holds the key `login` or sign_in saved (0600, in a 0700 folder).
const configDir = process.env.XDG_CONFIG_HOME || (process.platform === 'win32' && process.env.APPDATA) || path.join(os.homedir(), '.config');
const home = path.join(configDir, 'seeker-tunnel');
const keyFile = path.join(home, 'key');
const LOGIN = `npm run login in ${import.meta.dirname}`;

// The key: SEEKER_API_KEY if set, else the saved one. Sent only to the server, never printed or logged.
const ENV_KEY = process.env.SEEKER_API_KEY || '';
function savedKey() {
  try { return fs.readFileSync(keyFile, 'utf8').trim(); } catch (e) {
    if (e.code !== 'ENOENT') log(`can't read ${keyFile}: ${e.message}`);
    return '';
  }
}
function saveKey(key) { // atomically: a temporary file, then a rename over the old one
  fs.mkdirSync(home, { recursive: true, mode: 0o700 });
  fs.chmodSync(home, 0o700);
  const tmp = `${keyFile}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, `${key}\n`, { mode: 0o600 });
    fs.chmodSync(tmp, 0o600);
    fs.renameSync(tmp, keyFile);
  } catch (e) { fs.rmSync(tmp, { force: true }); throw e; }
}
let KEY = command === 'serve' ? ENV_KEY || savedKey() : '';

// The only MCP knowledge here (besides sign-in mode, below): every string in the arguments of the
// agent's tools/call requests, so the server can open files only at paths the agent named.
const agentStrings = new Set();
function collect(v) {
  if (typeof v === 'string') {
    agentStrings.delete(v); agentStrings.add(v);
    if (agentStrings.size > 10000) agentStrings.delete(agentStrings.values().next().value);
  } else if (v && typeof v === 'object') for (const x of Object.values(v)) collect(x);
}

let ws = null, state = 'connecting', why = '', attempt = 0, stopping = false, pinger = null, lastRx = 0;
let initMsg = null, initAnswered = false, reinitN = 0, mcpParts = [];
const queue = []; // agent messages waiting for the connection: [line, messages]
const inflight = new Map(); // agent requests the server hasn't answered yet
const streams = new Map(); // TCP connections and files, by stream id
const idKey = (id) => `${typeof id}:${id}`;

function frame(type, id, body) {
  const b = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body ?? {}));
  const f = Buffer.allocUnsafe(5 + b.length);
  f[0] = type; f.writeUInt32BE(id, 1); b.copy(f, 5);
  if (ws?.readyState === WebSocket.OPEN) ws.send(f);
}
function sendMcp(text) {
  let b = Buffer.from(text);
  for (; b.length > FRAME_MAX; b = b.subarray(FRAME_MAX)) frame(T.mcpPart, 0, b.subarray(0, FRAME_MAX));
  frame(T.mcp, 0, b);
}

// stdio side
const toAgent = (m) => process.stdout.write(`${typeof m === 'string' ? m : JSON.stringify(m)}\n`);
const requests = (msgs) => msgs.filter((m) => m?.method && m.id != null);
function refuse(msgs, message) {
  for (const m of requests(msgs)) toAgent({ jsonrpc: '2.0', id: m.id, error: { code: -32000, message: `seeker-tunnel: ${message}` } });
}
function fromAgent(line) {
  if (!line.trim()) return;
  let parsed = null, bad = false;
  try { parsed = JSON.parse(line); } catch { bad = true; /* forwarded as it is; the server answers */ }
  const msgs = [parsed].flat().filter((m) => m && typeof m === 'object');
  for (const m of msgs) if (m.method === 'tools/call') collect(m.params?.arguments);
  if (state === 'local') return bad ? toAgent({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) : msgs.forEach(local);
  if (state === 'open') forward(line, msgs);
  else if (state === 'connecting') queue.push([line, msgs]);
  else refuse(msgs, `not connected to the seeker server: ${why}. Retrying in the background.`);
}
function forward(line, msgs) {
  for (const m of msgs) if (m.method === 'notifications/cancelled') inflight.delete(idKey(m.params?.requestId));
  for (const m of requests(msgs)) {
    inflight.set(idKey(m.id), m);
    if (m.method === 'initialize') initMsg = m;
  }
  sendMcp(line);
}
function fromServer(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { return log('dropped a message from the server that is not JSON'); }
  for (const m of [parsed].flat()) {
    if (!m || m.method || m.id == null) continue;
    if (String(m.id).startsWith(REINIT)) return reinitDone(m);
    if (initMsg && idKey(m.id) === idKey(initMsg.id)) initAnswered = true;
    inflight.delete(idKey(m.id));
  }
  toAgent(/[\r\n]/.test(text) ? JSON.stringify(parsed) : text);
}
// A new connection is a new server session: replay the agent's initialize (answer swallowed),
// then send what waited.
function ready() {
  state = 'open';
  for (const [line, msgs] of queue.splice(0)) forward(line, msgs);
}
function reinitDone(m) {
  if (m.error) log(`the server refused the replayed initialize: ${m.error.message}`);
  sendMcp(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }));
  ready();
}

// WebSocket side
function connect() {
  if (stopping) return;
  state = 'connecting'; mcpParts = [];
  const url = new URL(process.env.SEEKER_TUNNEL_URL || SERVER);
  for (const [q, e] of [['mode', 'SEEKER_MODE'], ['help', 'SEEKER_HELP'], ['port', 'SEEKER_PORT']]) if (process.env[e]) url.searchParams.set(q, process.env[e]);
  const key = KEY = ENV_KEY || savedKey() || KEY; // a key saved meanwhile (npm run login) is used at once
  const sock = ws = new WebSocket(url, { headers: { Authorization: `Bearer ${key}` } });
  sock.binaryType = 'arraybuffer';
  let openedAt = 0;
  const lost = async (detail) => {
    if (ws !== sock) return;
    ws = null; clearTimeout(timer); clearTimeout(early); clearInterval(pinger);
    try { sock.close(); } catch { /* already closing */ }
    for (const s of streams.values()) { s.over = true; s.r?.destroy(); s.w?.destroy(); }
    streams.clear();
    if (stopping) return;
    const r = openedAt ? { why: `the connection to the seeker server dropped (${detail})` } : await (probe || whyRefused(url, key));
    if (stopping) return;
    // A saved key refused before the agent has its initialize answer: sign in first. (An env key
    // can't be fixed by signing in; a refusal mid-session is answered like any other.)
    if (r.refused && !ENV_KEY && !initAnswered) return signInMode(r.refused);
    why = r.why;
    log(why);
    const waiting = [...inflight.values(), ...queue.splice(0).flatMap(([, msgs]) => msgs)];
    inflight.clear();
    refuse(waiting, openedAt ? `${why}; reconnecting, and the server logs in to the game again. Retry the call.` : `${why}. Retrying in the background.`);
    if (openedAt && Date.now() - openedAt > 5000) { attempt = 0; connect(); }
    else { state = 'down'; setTimeout(connect, Math.min(30000, 500 * 2 ** attempt++)); }
  };
  // Cloudflare answers a path with no Worker (a retired version) only after ~20 s: if the upgrade
  // takes over 3 s, start asking why already.
  let probe = null;
  const early = setTimeout(() => { probe = whyRefused(url, key); }, 3000);
  const timer = setTimeout(() => lost('no answer in 30 s'), 30000);
  sock.onopen = () => {
    clearTimeout(timer); clearTimeout(early); openedAt = lastRx = Date.now();
    log(`connected to ${url.origin}${url.pathname}`);
    pinger = setInterval(() => (Date.now() - lastRx > 75000 ? lost('no answer to pings') : frame(T.ping, 0, { t: Date.now() })), 30000);
    if (initMsg) sendMcp(JSON.stringify({ ...initMsg, id: `${REINIT}${++reinitN}` }));
    else ready();
  };
  sock.onmessage = (ev) => (typeof ev.data === 'string' ? log('ignored a text message') : onFrame(Buffer.from(ev.data)));
  sock.onclose = (ev) => lost(`${ev.code}${ev.reason ? `: ${ev.reason}` : ''}`);
}
// The WebSocket API hides the HTTP status of a refused upgrade: ask again with a plain GET.
// { why, refused: the status and text when the server refused the key }
async function whyRefused(url, key) {
  const http = new URL(url);
  http.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
  const where = `${http.origin}${http.pathname}`;
  try {
    const r = await fetch(http, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(25000) });
    const text = (await r.text()).trim().slice(0, 300);
    if (r.status === 401 || r.status === 403) {
      const refused = `HTTP ${r.status}${text ? `: ${text}` : ''}`;
      return { refused, why: ENV_KEY ? `the server refused the API key (${refused}); fix or remove SEEKER_API_KEY in this MCP server's config`
        : `the server refused the saved API key (${refused}); sign in again: ${LOGIN}, or reconnect this MCP server and call sign_in` };
    }
    if (r.status === 400) return { why: `the server refused the connection: ${text || 'HTTP 400'}` };
    if (r.status === 503) return { why: `the server at ${where} is not ready (HTTP 503${text ? `: ${text}` : ''}); try again later` };
    if (r.status === 426) return { why: `the server at ${where} is up, but the WebSocket to it failed` };
    return { why: `${where} answered HTTP ${r.status}: this proxy's version (${VERSION}) may no longer be served; update seeker-tunnel (git pull in ${import.meta.dirname})` };
  } catch (e) {
    return { why: `can't reach ${where}: ${e.cause?.message || e.message}` };
  }
}

// Sign-in: GitHub's device flow, relayed by the seeker server's origin (it holds the OAuth app,
// checks who may use seeker and gives out the key); the proxy never talks to GitHub itself.
//   POST /auth/device -> 200 { device_code, user_code, verification_uri, expires_in, interval },
//     else { error, message }
//   POST /auth/device/token { device_code } -> 200 { key, login }, or 200 { error, message }:
//     authorization_pending, slow_down (with a new interval), expired_token, access_denied,
//     not_allowed (signed in, but not let in; the message names the GitHub login)
const AUTH = process.env.SEEKER_AUTH_URL?.replace(/\/+$/, '') || (() => {
  const u = new URL(process.env.SEEKER_TUNNEL_URL || SERVER);
  u.protocol = { 'wss:': 'https:', 'ws:': 'http:' }[u.protocol] ?? u.protocol;
  return u.origin;
})();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unreachable = (e) => `can't reach ${AUTH}: ${e.cause?.message || e.message}`;
async function authPost(route, body) {
  const r = await fetch(`${AUTH}${route}`, {
    method: 'POST', signal: AbortSignal.timeout(20000), body: body && JSON.stringify(body),
    headers: { accept: 'application/json', 'user-agent': `seeker-tunnel/${VERSION}`, ...(body && { 'content-type': 'application/json' }) },
  });
  const j = await r.json().catch(() => null);
  return { status: r.status, j: j && typeof j === 'object' ? j : {} };
}
async function startFlow() {
  let r;
  try { r = await authPost('/auth/device'); } catch (e) { throw new Error(unreachable(e)); }
  const { device_code: device, user_code: code, verification_uri: uri, expires_in: life, interval } = r.j;
  if (r.status !== 200 || !device || !code || !uri) throw new Error(`the sign-in service answered HTTP ${r.status}${r.j.message ? `: ${r.j.message}` : ` (${AUTH}/auth/device)`}`);
  return { device, code, uri, until: Date.now() + (life > 0 ? life : 900) * 1000, interval: interval > 0 ? interval : 5 };
}
const minutes = (flow) => Math.max(1, Math.round((flow.until - Date.now()) / 60000));
// Polls until the flow ends: { key, login }, or { error, message }. Network trouble, 429 and 5xx
// are retried until the code expires; onPoll(r) after each poll that doesn't end it.
async function waitForKey(flow, onPoll = () => {}) {
  for (;;) {
    await sleep(flow.interval * 1000);
    let r;
    if (Date.now() >= flow.until) r = { error: 'expired_token' };
    else {
      try {
        const { status, j } = await authPost('/auth/device/token', { device_code: flow.device });
        r = status === 200 ? j : status === 429 || status >= 500 ? { error: 'retry', message: `HTTP ${status}` }
          : { error: 'refused', message: `the sign-in service answered HTTP ${status}${j.message ? `: ${j.message}` : ''}` };
      } catch (e) { r = { error: 'retry', message: unreachable(e) }; }
    }
    if (typeof r.key === 'string' && r.key && r.login) return r;
    if (r.error === 'slow_down') flow.interval = r.interval > 0 ? r.interval : flow.interval + 5;
    else if (r.error === 'retry') log(`sign-in: ${r.message}; trying again`);
    else if (r.error !== 'authorization_pending') return r.error ? r : { error: 'bad answer', message: 'the sign-in service gave an answer this proxy doesn\'t know' };
    onPoll(r);
  }
}
const sentence = (t) => (/[.!?]$/.test(t) ? t : `${t}.`);
function outcome(r) {
  if (r.error === 'expired_token') return 'The sign-in code expired before it was entered.';
  if (r.error === 'access_denied') return sentence(r.message || 'Sign-in was cancelled on GitHub');
  if (r.error === 'not_allowed') return sentence(r.message || 'This GitHub account may not use seeker');
  return sentence(`Sign-in failed: ${r.message || r.error}`);
}

// `login`, in a terminal.
async function login() {
  let flow;
  try { flow = await startFlow(); } catch (e) { die(`can't start the sign-in: ${e.message}`); }
  process.stdout.write(`Open ${flow.uri} and enter ${flow.code} (expires in ${minutes(flow)} min).\nWaiting for you to sign in...\n`);
  const r = await waitForKey(flow);
  if (!r.key) die(`${outcome(r)}${r.error === 'expired_token' ? ' Run it again for a new code.' : ''}`);
  try { saveKey(r.key); } catch (e) { die(`can't save the key to ${keyFile}: ${e.message}`); }
  process.stdout.write(`Signed in as ${r.login}; key saved to ${keyFile}\n`);
  if (ENV_KEY) log('SEEKER_API_KEY is set here: wherever it is set, it is used instead of the saved key');
  process.exit(0);
}
function logout() {
  try {
    if (!fs.existsSync(keyFile)) process.stdout.write(`Not signed in: no key at ${keyFile}\n`);
    else { fs.rmSync(keyFile); process.stdout.write(`Signed out: deleted ${keyFile}\n`); }
  } catch (e) { die(`can't delete ${keyFile}: ${e.message}`); }
  if (ENV_KEY) log('SEEKER_API_KEY is still set here, and is used wherever it is set');
}

// Sign-in mode, in MCP: no key, or the saved one refused before the agent had its initialize
// answer. The proxy answers MCP itself, with one tool, sign_in, and doesn't connect. Once the key
// is saved, the agent reconnects the server: the new process connects with it. (No switching to
// the real server in this process: its initialize answer has instructions the agent would miss.)
let signIn = null; // { refused, flow, starting, ended, login, polled }
const SIGN_IN = {
  name: 'sign_in',
  description: 'Sign in to seeker with GitHub. The first call answers with a link and a code for the user to enter; call it again once they have. Then reconnect this MCP server to load seeker\'s tools.',
  inputSchema: { type: 'object', properties: {} },
};
const RECONNECT = 'Reconnect the seeker MCP server to load its tools (Claude Code: /mcp, then Reconnect; elsewhere, restart the server or your agent).';
function signInMode(refused) {
  state = 'local';
  signIn = { refused, flow: null, starting: null, ended: null, login: null, polled: [] };
  log(refused ? `the server refused the saved API key (${refused}): answering MCP here until you sign in again (the sign_in tool, or ${LOGIN})`
    : `not signed in: answering MCP here until you sign in (the sign_in tool, or ${LOGIN})`);
  const waiting = [...inflight.values(), ...queue.splice(0).flatMap(([, msgs]) => msgs)];
  inflight.clear();
  waiting.forEach(local);
}
function local(m) {
  if (!m.method || m.id == null) return; // notifications, and answers (we ask nothing)
  const answer = (result) => toAgent({ jsonrpc: '2.0', id: m.id, result });
  const text = (t, isError) => answer({ content: [{ type: 'text', text: t }], ...(isError && { isError: true }) });
  if (m.method === 'initialize') {
    return answer({
      protocolVersion: typeof m.params?.protocolVersion === 'string' ? m.params.protocolVersion : '2025-06-18',
      capabilities: { tools: {} },
      serverInfo: { name: 'seeker-tunnel', version: VERSION },
      instructions: `${signIn.refused ? `seeker refused the saved key (${signIn.refused})` : 'seeker is not signed in yet'}, so its tools aren't loaded. `
        + 'Call sign_in: it answers with a GitHub link and a code for the user. Once they have signed in, call sign_in again, then reconnect this MCP server to load seeker\'s tools.',
    });
  }
  if (m.method === 'ping') return answer({});
  if (m.method === 'tools/list') return answer({ tools: [SIGN_IN] });
  if (m.method === 'tools/call' && m.params?.name === 'sign_in') return void signInCall().then(([t, isError]) => text(t, isError), (e) => text(`sign_in failed: ${e.message}`, true));
  if (m.method === 'tools/call') return text(`seeker is not signed in, so ${m.params?.name ?? 'this tool'} isn't available yet: call sign_in first.`, true);
  toAgent({ jsonrpc: '2.0', id: m.id, error: { code: -32601, message: `Method not found: ${m.method} (seeker-tunnel is not signed in: call sign_in)` } });
}
// One answer of sign_in: [text, isError].
async function signInCall() {
  const s = signIn;
  // A flow under way: wait for its next poll (at most its interval and 5 s), then say where it is.
  if (s.flow && !s.login && !s.ended) await new Promise((r) => { s.polled.push(r); setTimeout(r, s.flow.interval * 1000 + 5000); });
  if (s.login) return [`Signed in as ${s.login}. ${RECONNECT}`];
  if (s.ended) {
    const r = s.ended;
    s.ended = s.flow = null;
    return [`${outcome(r)} Call sign_in again ${r.error === 'expired_token' ? 'for a new code' : 'to start over'}.`, true];
  }
  const saved = !ENV_KEY && savedKey();
  if (!s.flow && saved && saved !== KEY) return [`Signed in: a new key was saved meanwhile (npm run login). ${RECONNECT}`];
  let start = false;
  if (!s.flow) {
    s.starting ??= startFlow().then((flow) => { s.flow = flow; pollFlow(s, flow); }).finally(() => { s.starting = null; });
    try { await s.starting; } catch (e) { return [`Can't start the sign-in: ${e.message}. Try again later.`, true]; }
    start = true;
  }
  const why = s.refused ? `seeker refused the saved key (${s.refused}). ` : '';
  s.refused = null; // said once
  const { uri, code } = s.flow;
  return [`${why}${start ? 'To use seeker, sign in with GitHub' : 'Not signed in yet'}: open ${uri} and enter ${code} (expires in ${minutes(s.flow)} min). Then call sign_in again.`];
}
async function pollFlow(s, flow) {
  const wake = () => { for (const w of s.polled.splice(0)) w(); };
  let r = await waitForKey(flow, wake);
  if (s.flow !== flow) return;
  if (r.key) {
    try { saveKey(r.key); s.login = r.login; log(`signed in as ${r.login}; key saved to ${keyFile}`); }
    catch (e) { r = { error: 'save', message: `can't save the key to ${keyFile}: ${e.message}` }; }
  }
  if (!r.key || !s.login) { s.ended = r; log(`sign-in: ${outcome(r)}`); }
  wake();
}

function onFrame(buf) {
  lastRx = Date.now();
  if (buf.length < 5) return log('ignored a frame shorter than its header');
  const type = buf[0], id = buf.readUInt32BE(1), body = buf.subarray(5);
  if (type === T.data) return onData(streams.get(id), body);
  if (type === T.mcpPart) return void mcpParts.push(body);
  if (type === T.mcp) return fromServer(Buffer.concat([...mcpParts.splice(0), body]).toString());
  if (type === T.ping) return frame(T.pong, id, body);
  if (type === T.pong) return;
  let j = null;
  try { j = JSON.parse(body.toString() || '{}'); } catch { /* checked below */ }
  if (type === T.open || type === T.fopen) {
    return j && typeof j === 'object' ? open(type, id, j) : frame(T.error, id, { code: 'bad frame', message: 'the body is not a JSON object' });
  }
  const s = streams.get(id);
  if (!s) return; // a stream that has ended
  if (type === T.credit && Number.isInteger(j?.bytes) && j.bytes > 0) { s.credit += j.bytes; pump(s); }
  else if (type === T.close) s.kind === 'write' && s.w ? finishWrite(s) : end(s, 'closed');
  else log(`ignored a frame of type ${type} on stream ${id}`);
}

const ERRS = { ECONNREFUSED: 'refused', ETIMEDOUT: 'timeout', ENOTFOUND: 'unreachable', EAI_AGAIN: 'unreachable', EHOSTUNREACH: 'unreachable', ENETUNREACH: 'unreachable', ECONNRESET: 'reset', EPIPE: 'reset', ENOENT: 'not found' };
const codeOf = (e) => ERRS[e.code] || 'io error';

function open(type, id, j) {
  const err = (code, message) => frame(T.error, id, { code, message });
  if (id === 0 || streams.has(id)) return log(`ignored an open on stream ${id}, which is in use`);
  if (streams.size >= MAX_STREAMS) return err('too many streams', `at most ${MAX_STREAMS} streams can be open at once`);
  if (type === T.open) {
    const { host, port } = j;
    if (typeof host !== 'string' || !Number.isInteger(port) || port < 1 || port > 65535) return err('bad frame', 'open needs {host, port}');
    if (!allowed(host, port)) return err('not allowed', `${host}:${port} is not on this proxy's whitelist (${rules.map((r) => `${r.host}:${r.port}`).join(',')}); add it with --allow`);
    const sock = net.connect({ host, port });
    const s = add(id, 'tcp', sock, sock);
    sock.setTimeout(10000, () => { fail(s, 'timeout', `${host}:${port} didn't answer in 10 s`); sock.destroy(); });
    sock.once('connect', () => { sock.setTimeout(0); frame(T.opened, id, { address: sock.localAddress, port: sock.localPort }); });
    return;
  }
  const { path: p, mode, size } = j;
  if (typeof p !== 'string' || (mode !== 'read' && mode !== 'write') || (mode === 'write' && !(Number.isInteger(size) && size >= 0))) {
    return err('bad frame', 'fopen needs {path, mode: "read" or "write", size for a write}');
  }
  if (!agentStrings.has(p)) return err('path not from the agent', `"${p}" is not a path the agent passed in a tool call; pass the path explicitly`);
  if (mode === 'write' && size > maxWrite) return err('too large', `${size} bytes is over this proxy's write cap of ${maxWrite / MiB} MiB`);
  const abs = path.resolve(p), s = add(id, mode, null, null);
  (async () => {
    if (mode === 'write') await fsp.mkdir(path.dirname(abs), { recursive: true });
    const fh = await fsp.open(abs, mode === 'write' ? 'w' : 'r');
    const st = await fh.stat().catch(async (e) => { await fh.close(); throw e; });
    if (s.over) return fh.close();
    if (mode === 'read' && !st.isFile()) { await fh.close(); return fail(s, 'io error', `${abs} is not a file`); }
    if (mode === 'read') s.r = fh.createReadStream({ highWaterMark: FRAME_MAX });
    else s.w = fh.createWriteStream();
    wire(s);
    frame(T.opened, id, mode === 'read' ? { path: abs, size: st.size } : { path: abs });
  })().catch((e) => fail(s, codeOf(e), e.message));
}

function add(id, kind, r, w) {
  const s = { id, kind, r, w, credit: WINDOW_OUT, window: WINDOW_IN, owed: 0, written: 0, pending: [], eof: false, closing: false, over: false };
  streams.set(id, s);
  if (r || w) wire(s);
  return s;
}
function wire(s) {
  if (s.r) {
    s.r.on('data', (c) => { s.pending.push(c); pump(s); });
    s.r.on('end', () => { s.eof = true; pump(s); });
  }
  for (const x of new Set([s.r, s.w])) x?.on('error', (e) => fail(s, codeOf(e), e.message));
}
// Send what the stream has read, as far as the server's credit goes; past that, stop reading.
function pump(s) {
  if (s.over) return;
  while (s.pending.length && s.credit > 0) {
    const c = s.pending[0], n = Math.min(c.length, s.credit, FRAME_MAX);
    frame(T.data, s.id, c.subarray(0, n));
    s.credit -= n;
    if (n < c.length) s.pending[0] = c.subarray(n);
    else s.pending.shift();
  }
  if (s.pending.length) s.r.pause();
  else if (s.eof) end(s, 'eof');
  else s.r?.resume();
}
function onData(s, body) {
  if (!s || s.over || s.closing) return;
  if (!s.w) return fail(s, 'bad frame', 'data on a stream that is not open for writing');
  if (body.length > FRAME_MAX) return fail(s, 'bad frame', 'a data frame over 1 MiB');
  if ((s.window -= body.length) < 0) return fail(s, 'no credit', 'data past the credit this proxy gave');
  if (s.kind === 'write' && (s.written += body.length) > maxWrite) return fail(s, 'too large', `over this proxy's write cap of ${maxWrite / MiB} MiB`);
  s.w.write(body, (e) => {
    if (e || s.over || (s.owed += body.length) < CREDIT_STEP) return;
    frame(T.credit, s.id, { bytes: s.owed });
    s.window += s.owed; s.owed = 0;
  });
}
function finishWrite(s) {
  s.closing = true;
  s.w.end((e) => (e ? fail(s, codeOf(e), e.message) : end(s, 'done', { bytes: s.written })));
}
function finish(s, type, body) {
  if (s.over) return;
  s.over = true; streams.delete(s.id);
  frame(type, s.id, body);
  if (type === T.close && s.kind === 'tcp') s.w.end(() => s.w.destroy());
  else { s.r?.destroy(); s.w?.destroy(); }
}
const end = (s, reason, extra) => finish(s, T.close, { reason, ...extra });
const fail = (s, code, message) => finish(s, T.error, { code, message });

if (command === 'login') login();
else if (command === 'logout') logout();
else {
  process.stdout.on('error', () => process.exit(0)); // the agent is gone
  readline.createInterface({ input: process.stdin, crlfDelay: Infinity }).on('line', fromAgent).on('close', () => {
    stopping = true;
    clearInterval(pinger);
    for (const s of streams.values()) { s.r?.destroy(); s.w?.destroy(); }
    ws?.close(1000, 'the agent ended the session');
    setTimeout(() => process.exit(0), 1000).unref();
  });
  if (KEY) connect();
  else signInMode(null);
}
