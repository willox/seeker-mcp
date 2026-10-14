---
name: tgstation-client
description: Play and test on tgstation, or any Space Station 13 server built on the tgstation codebase, through the seeker MCP tools (connect, look, walk_to, tgui_act...). Covers playing the game, reading the server's DM source for answers, and, when you are an admin there, acting as the developer's all-powerful assistant: teleporting people, spawning items and mobs, jobs, ID access and antagonist roles, healing and reviving, turning people into monkeys or cyborgs, fixing machines and power, opening any door, Lua, SDQL2, View Variables and proc calls. Use it whenever the seeker tools are connected to a tgstation-like server, or the user asks for something in such a game.
---

# tgstation client

You are connected to a tgstation server (or a fork of it) as a guest, through the seeker MCP
tools. Most of the time it is a developer's own test server: they are changing the game's code and
want to see it work. On such a server you are usually an **admin**, and that makes you a god: you
can teleport anyone anywhere, conjure any object, rewrite any variable and run any code, in seconds.
Humans are slow at this (menus, typing type paths, hunting through panels). You are not. Use that
to make the developer's testing fast and fun.

Further reading in this skill, open when you need it:

- [references/admin-cookbook.md](references/admin-cookbook.md): every common request, the fastest way to do it, and a fallback.
- [references/lua-and-sdql.md](references/lua-and-sdql.md): Lua and SDQL2 recipes, ready to paste.
- [references/admin-verbs.md](references/admin-verbs.md): the admin verbs by category, and what each prompts for.
- [references/reading-the-code.md](references/reading-the-code.md): finding answers in the DM source.
- [references/playing.md](references/playing.md): playing the game itself (jobs, doors, combat, radio, the HUD).

## First minute

1. `connect`, then read the answer: where you are, whether you are in the lobby, recent chat.
2. In the lobby, pick a body. To work as an admin, **observe** (`lobby {action: "observe"}`, then
   `answer_alert {button: "Yes"}`): a ghost flies through walls and is never in the way. To play,
   `lobby {action: "join"}` and pick a job in the window it opens.
3. Check whether you are an admin: `verbs {filter: "Admin", field: "category"}`. If verbs such as
   *Jump To Area*, *Spawn* and *SDQL2 Query* are there, you are. tgstation gives full admin rights
   to connections from the same machine (`ENABLE_LOCALHOST_RANK` in `config/config.txt`), which is
   the usual case for a developer's server.
4. Find out who else is here (below), and find the source code (below).

## Who is on the server

- Usually exactly one other person: **the developer you are working with**. When they say "me",
  "my character" or "I", they mean their mob, not yours. Find it before acting on it.
- There **could** be other players, or other test clients. Never point mass actions (every mob,
  every door, `Del-All`, global smites, round end, reboots) at a server with people you were not
  asked to affect. When a request is ambiguous about who it targets, ask.
- The developer may talk to you in your conversation, or in the game (`read_chat`,
  `wait {from_others: true}`). Admin PMs and adminhelps reach you too.

Who is connected, with where they are (fastest, Lua: see the Lua section):

```lua
for _, c in dm.global_vars.GLOB.clients do
  local m = c.mob
  print(c.ckey, m.name, m.type, m.x, m.y, m.z, c.holder ~= nil)
end
```

Without Lua: `command {line: "Who"}`, *Player Panel*, or `search` for mobs. Once you know their
mob, *Jump To Mob* / *Jump To Key* takes you to them, so their mob gets an id you can target.

## How admin tools work through these tools

- **Admin verbs are verbs.** Run one by name with `command {line: "Jump-To-Area"}` (spaces become
  `-`) or `call_verb {name: "Jump To Area"}`. `verbs {filter: "jump"}` finds them.
- **Most of tgstation's admin verbs ask for their arguments in tgui windows**, not on the command
  line. The answer to the verb shows the window under `opened_windows`, with its choices and an
  `answer:` line saying exactly what to send. Answer with `tgui_act`:
  - list (`ListInputWindow`): `tgui_act {id, action: "submit", params: {entry: "The Bar"}}`. The
    entry may be the exact choice, its number, or a unique part of it. Long lists are cut:
    `tgui_window {id, find: "/medbay/i"}` lists matching choices.
  - text (`TextInputModal`) and number (`NumberInputModal`): `submit {entry: ...}`.
  - yes/no (`AlertModal`): `tgui_act {id, action: "choose", params: {choice: "Yes"}}`.
  - Chains are normal: SDQL2 asks for the query, then "Run SDQL2 Query?". The next window reuses
    the same id (`tgui-window-1`). `status` lists anything still waiting (`pending_tgui_inputs`).
- **Verbs that act on a thing** (View Variables, Rejuvenate, Delete, Select Equipment, Jump To Mob,
  Get Mob, Send Mob, Smite, Possess Obj, Atom ProcCall, Show Player Panel, Make Cyborg...) take it
  as an argument: `call_verb {name: "Rejuvenate", args: [{object_id: 2957, kind: "mob"}]}`. Or run
  the verb with no argument (`command {line: "Rejuvenate"}`) and the client's own input box lists
  the candidates the client knows: `answer_prompt {value: "Bryant Wise"}`. A mob the client has
  never seen is not listed: jump to it first, or do it in Lua.
- **Admin output is hidden from action answers** (`admin_lines: N left out`) so play stays readable.
  `read_chat` shows it. HTML panels (View Variables, Player Panel, SDQL2 results) open as browser
  windows: `windows` lists them, `windows {name}` reads one, `topic {href}` clicks a link in it.
- Answers label admin verbs "admin tools: don't use them in play". That guard is for ordinary play.
  When the developer asks for something, admin tools are exactly the right tool.
- Admin actions are logged and announced to admins ("ADMIN LOG: ..."). That is expected on a test
  server.

## Your power tools, fastest first

1. **Lua** (*Open Lua Editor*, if the server has the Lua library loaded): arbitrary code against
   live objects, with results. One verb, one window, then `runCode` as often as you like.
2. **SDQL2** (*SDQL2 Query*): query, update, call procs on, or delete everything matching a
   selector. Great for "all the X" and for one exact object.
3. **Purpose-built verbs**: *Rejuvenate*, *Select Equipment*, *Grant Full Access*, *Send Mob*,
   *Spawn*, *Make Cyborg*, *Give Direct Control*... Fine when the target is in reach.
4. **View Variables** (VV), *Atom ProcCall* and *Advanced ProcCall*: precise but click-heavy.
5. **Panels**: *Secrets* (station-wide buttons: power everything, fix gravity...), *Spawn Panel*,
   *Player Panel*, *Check Antagonists*, *Game Panel*, *Toggle Build Mode Self*.

### Lua in four calls

```text
command   {line: "Open-Lua-Editor"}                      -> opened_windows: tgui-window-1 (LuaEditor)
tgui_act  {id: "tgui-window-1", action: "newState", params: {name: "agent"}}
tgui_act  {id: "tgui-window-1", action: "runCode",  params: {code: "print(dm.usr.name)"}}
tgui_window {id: "tgui-window-1", path: "data.stateLog"} -> prints, return values, errors
```

States live on the server: after a reconnect, open the editor again and
`switchState {index: 1}` instead of making a new one. `print` and `return` values show up in
`data.stateLog`; read the end of it after each run. Handy pieces:

- Start scripts that use the helpers with `local SS13 = require("SS13")` (it isn't a global).
- `dm.usr` is your mob; `dm.global_vars.GLOB.clients` every client; `dm.global_vars.SSticker`,
  `SSshuttle`... the subsystems.
- `dm.global_procs._locate(x, y, z)` a turf; `dm.global_procs._get_step(thing, 0).loc` its area.
- `SS13.new("/obj/item/gun/energy/e_gun", turf)` makes anything; `SS13.type("/datum/...")` a path;
  `SS13.qdel(thing)` deletes.
- Call procs with a colon (`mob:revive()`), read and write vars with a dot (`apc.operating = 1`).
- DM's `FALSE`/`0` is *true* in Lua: test `x == 0`, never `not x`.

Full recipes: [references/lua-and-sdql.md](references/lua-and-sdql.md).

### SDQL2 in three calls

```text
command  {line: "SDQL2-Query"}                                            -> TextInputModal
tgui_act {id: "tgui-window-1", action: "submit", params: {entry: "SELECT /mob WHERE client"}}
tgui_act {id: "tgui-window-1", action: "choose", params: {choice: "Yes"}} -> results: read_chat, windows "SDQL-result-N"
```

Always run a `SELECT` with the same selector before an `UPDATE`, `CALL` or `DELETE`. The query box
HTML-encodes what you type, so `"`, `'`, `<`, `>` and `&` break a query: no string literals, chain
`WHERE a WHERE b` instead of `&&`, and target one thing with *Mark Object* and `src == marked`.
Anything needing text goes to Lua.

## The everyday requests, at a glance

Details, fallbacks and more in [references/admin-cookbook.md](references/admin-cookbook.md).
"Them" is the developer's mob.

| They say | Do |
|---|---|
| take me to *area* | *Send Mob*: their mob, then the area (list choice). Lua: `m:forceMove(turf)`. |
| bring me to you / come to me | *Get Mob* / *Get Key*; *Jump To Key* to go to them. |
| give me *job* access / all access | *Grant Full Access* (all). One job: Lua, `apply_trim_to_card` on `SSid_access` (cookbook). Or *Select Equipment* with that job's outfit. |
| make me a monkey / human again | Lua `m:monkeyize()` / `m:humanize()`; Player Panel has buttons too. |
| make me a borg / an AI | *Make Cyborg* on their mob; Lua `m:Robotize()` / `m:AIize()`. |
| make me a traitor / syndicate / an antag | Lua `m.mind:add_antag_datum(SS13.type("/datum/antagonist/traitor"))` (nukeop, changeling, heretic, cult, wizard, rev/head, malf_ai, ...). Or *Show Traitor Panel*. |
| heal me / revive me | *Rejuvenate* on their body, dead or alive. |
| spawn *N* humans / NPCs | Go where they should be, then *Spawn* `/mob/living/carbon/human:5` (`path:amount`). Dress them with *Select Equipment*. |
| give me guns / tools | Lua `m:put_in_hands(SS13.new(path, m.loc))`, or *Spawn* next to them. *Select Equipment* "Debug outfit" for a full kit. |
| fix this machine | Lua `obj:repair_damage(obj.max_integrity)` and `obj:set_machine_stat(0)` (*Rejuvenate* is for mobs only). |
| give this room power | Lua: the area's `apc`: fill `apc.cell.charge`, `apc.operating = true`, `apc:update()`. Whole station: *Secrets* "power". |
| open this door / let me through | Lua `door:unbolt()`, `door.welded = false`, `door:open(2)` (2: skip the access check); or *Toggle Admin AI Interact* and click it as a ghost. |
| give me control of this mob | *Give Direct Control*: pick the mob, then their client (both lists). |
| make me invincible | Lua `dm.global_procs._add_trait(m, "godmode", "admin")`. |
| what broke? | *View Runtimes*: the round's runtime errors, with file and line: perfect after a code change. |

## Reading the code

The server's DM source is available to you somewhere on this machine or in the workspace; don't
assume a path. Find the checkout by looking for the project's `.dme` file (`tgstation.dme` in
tgstation itself) near your working directory, or ask the developer. Then grep it: the source
answers what no in-game tool can (which proc to call, what a var means, what access a door wants,
why a button does nothing). See [references/reading-the-code.md](references/reading-the-code.md).

Quick map of a tgstation tree: `code/` (all DM code), `code/__DEFINES/` (constants: trait names,
access levels, flags), `code/modules/admin/` (admin tools), `_maps/` (maps; `load_map` takes the
station map named in the stat panel's "Map:" line), `tgui/packages/tgui/interfaces/` (the tgui
windows), `config/` (server settings). The developer's own changes are usually the uncommitted or
newest work in that checkout (`git status`, `git log`): look there first when they ask you to test
"my change".

## Playing the game

When asked to play, or when you are not an admin, play as a person would: the tools see what the
game shows you. Start with [references/playing.md](references/playing.md). In short: `look` and
`view` show the surroundings, `walk_to` and `explore` move you, `click` uses things (the item in
your active hand on the target), `inventory` and `screen` show what you hold and the HUD,
`tgui_window` / `tgui_act` drive machines, `say` talks (`;` for the radio).

## Etiquette and safety

- You are the developer's assistant, not a griefer. Do what they ask, quickly; on anything
  destructive or server-wide (deleting many things, explosions, ending the round, rebooting,
  changing config, banning), say what you are about to do and confirm unless they already said so.
- Leave other players alone unless the developer asks you to involve them.
- If you are **not** an admin, don't try to become one. Play normally, and tell the developer what
  admin rights would let you do (for example connect from the server's machine, or add the guest
  key to the server's admins).
- Before trusting a recipe, check it still matches this server's code: forks rename procs and
  types. When something errors, grep the source for the real name and try again.
- Report what happened, briefly: where they are now, what they hold, what changed. Fun is
  encouraged; making the developer wait is not.
