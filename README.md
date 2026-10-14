# seeker-tunnel

The local proxy for **seeker**, a cloud-based MCP server that lets your AI agent play Space Station
13 (tgstation, goonstation and similar games).
Your agent talks to this proxy; the game client runs in the cloud, and the proxy carries its
connection to your game server you. It always logs in as a guest with one of the following ckeys:

```
Guest-67
Guest-69
Guest-420
Guest-1337
```

The proxy is one file, [`seeker-tunnel.mjs`](seeker-tunnel.mjs), using only Node's standard
library.

## Install

You need **Node 24 or later**. Then:

```sh
git clone https://github.com/willox/seeker-mcp
```

(Or download the folder from GitHub and put it anywhere.)

That's all: **there are no dependencies, so there is nothing to `npm install`.**

## Sign in

In the folder, sign in with GitHub:

```sh
cd seeker-mcp
npm run login
```

It prints a link and a code: open the link, enter the code, and your key is saved. Or skip this
step: the first time your agent uses seeker, it gives you the link and the code itself.

## Add it to your agent

Give the full path to `seeker-tunnel.mjs`, such as `/home/you/seeker-mcp/seeker-tunnel.mjs`, or
on Windows `C:/Users/you/seeker-mcp/seeker-tunnel.mjs` (forward slashes work there too).

**Claude Code**

```sh
claude mcp add --env SEEKER_MODE=tgstation --transport stdio --scope user seeker -- node /home/you/seeker-mcp/seeker-tunnel.mjs
```

Settings go before the name with `--env`, one `--env` each. `--scope user` makes seeker available
in all your projects; leave it out for the current project only.

**Claude Desktop, Cursor, Windsurf, Gemini CLI, Cline, or a project's `.mcp.json`** all take the
same `mcpServers` block:

```json
{
  "mcpServers": {
    "seeker": {
      "command": "node",
      "args": ["C:/Users/you/seeker-mcp/seeker-tunnel.mjs"],
      "env": { "SEEKER_MODE": "tgstation", "SEEKER_PORT": "1337" }
    }
  }
}
```

| Client | Where it goes |
| --- | --- |
| Claude Desktop | Settings, Developer, Edit Config (`claude_desktop_config.json`) |
| Cursor | `~/.cursor/mcp.json`, or `.cursor/mcp.json` in a project |
| Windsurf | `mcp_config.json` |
| Gemini CLI | `~/.gemini/settings.json`, or `.gemini/settings.json` in a project |
| Cline | MCP Servers, Configure, Configure MCP Servers |
| Claude Code, per project | `.mcp.json` at the project's root |

**VS Code** (`.vscode/mcp.json`, or the command MCP: Open User Configuration):

```json
{
  "servers": {
    "seeker": {
      "type": "stdio",
      "command": "node",
      "args": ["/home/you/seeker-mcp/seeker-tunnel.mjs"],
      "env": { "SEEKER_MODE": "tgstation" }
    }
  }
}
```

**Codex** (`~/.codex/config.toml`):

```toml
[mcp_servers.seeker]
command = "node"
args = ["/home/you/seeker-mcp/seeker-tunnel.mjs"]

[mcp_servers.seeker.env]
SEEKER_MODE = "tgstation"
```

The examples set `SEEKER_MODE` to `tgstation`: game hints for tgstation and tgui. Use `goonstation`
for goonstation, or see Settings. Flags such as `--allow` go in `args`, after the path.

## Skills: tgstation-client and goonstation-client

Two agent skills come with the proxy, in [`skills/`](skills). **We suggest installing the one for
your game.** With it, your agent knows how to play the game, how to read the game's code for
answers, and, when it is an admin on your server (on your own test server it usually is: these
games make connections from the server's machine admins), how to use the admin tools for you:
teleporting you anywhere, spawning items, mobs and crowds, jobs, access and antagonist roles,
healing and reviving, turning you into a monkey or a cyborg, fixing machines and power, opening any
door, and running Lua, SDQL2, View Variables and proc calls. Ask "take me to the bar", "make me a
traitor" or "spawn five humans here" and it just happens.

| Skill | For |
|---|---|
| [`tgstation-client`](skills/tgstation-client/SKILL.md) | tgstation and the servers built on its code (`SEEKER_MODE=tgstation`) |
| [`goonstation-client`](skills/goonstation-client/SKILL.md) | goonstation and the servers built on its code (`SEEKER_MODE=goonstation`) |

They work best when your agent can also read the game's source code (a checkout of the server's
code in your project or on your machine).

**Claude Code**: copy the skill's folder into `~/.claude/skills/` (every project) or a project's
`.claude/skills/`:

```sh
mkdir -p ~/.claude/skills
cp -r skills/tgstation-client ~/.claude/skills/
```

On Windows: `xcopy /E /I skills\tgstation-client %USERPROFILE%\.claude\skills\tgstation-client`.
A link instead of a copy (`ln -s "$PWD/skills/tgstation-client" ~/.claude/skills/`) keeps it
up to date with `git pull`. The skill is used when your agent works on a tgstation-like server, or
call it by name: `/tgstation-client`.

**Claude Desktop and claude.ai**: zip the skill's folder and upload it as a skill in Claude's
settings.

**Other agents**: a skill is a folder with a `SKILL.md` and the files it links to. Agents that
support skills take the folder as it is (see their documentation for where); for the others, add
`SKILL.md` to the agent's instructions and keep its `references/` folder next to it.

## Settings

| Setting | What it does |
| --- | --- |
| `SEEKER_MODE` | `tgstation` (tgstation's hints and tgui's, as in the examples), `goonstation` (goonstation's and tgui's), `tgui` (tgui's only: the default when unset), or `raw` (no game hints). |
| `SEEKER_HELP` | `0` turns gameplay help off. |
| `SEEKER_PORT` | The game server port `connect` uses when your agent doesn't name one (default 1337). |
| `SEEKER_API_KEY` | Optional: a key to use instead of the one `npm run login` saved. |
| `--allow host:port,...` | The game servers the proxy may connect to (below). |
| `--max-write-mb N` | The largest file seeker may write, in MiB (default 64). |

The `SEEKER_` settings are environment variables (`env` above). Restart the MCP server after
changing one.

**Which game servers.** By default the proxy connects only to `127.0.0.1`, on any port: a game
server on your own machine. To play on another, list it with `--allow`; your list replaces the
default:

```json
"args": ["/home/you/seeker-mcp/seeker-tunnel.mjs", "--allow", "127.0.0.1:*,192.168.1.20:1337"]
```

Each entry is `host:port`, or `host:*` for any port. Hosts are compared as written: `localhost`
and `127.0.0.1` are different entries.

## Files

- Your key is in `~/.config/seeker-tunnel/key` (`%APPDATA%\seeker-tunnel\key` on Windows,
  `$XDG_CONFIG_HOME/seeker-tunnel/key` if that is set), readable only by you.
  `npm run logout` deletes it.
- Tools that save or read files (renders, reference images) can use only paths your agent passed
  in a tool call. Relative paths start from the folder your agent runs the proxy in.

The proxy never listens on a port, and opens nothing but those files and the game servers you
allow.

## Updating

```sh
cd seeker-mcp
git pull
```

Then restart the MCP server. Each version of the proxy talks to its own release of the seeker
server, so updating the proxy is how you get new tools. A version that is no longer served says
so when it connects.

`git pull` updates the skills too; copy them again if you copied them (links follow on their own).

## Troubleshooting

- **Logs** go to stderr, which your agent's client keeps in its MCP logs; stdout carries only MCP
  messages.
- **Signed in, but no tools**: reconnect the MCP server (Claude Code: `/mcp`, then Reconnect;
  elsewhere, restart the server or your agent).
- **"The server refused the saved API key"**: sign in again with `npm run login`, or reconnect
  the MCP server and let your agent sign you in. If you set `SEEKER_API_KEY`, fix or remove it:
  it is used instead of the saved key.
- **"not on this proxy's whitelist"**: the game server isn't in your `--allow` list.

