---
name: goonstation-client
description: Play and test on goonstation, or any Space Station 13 server built on the goonstation codebase, through the seeker MCP tools (connect, look, walk_to, tgui_act...). Covers playing the game, reading the server's DM source for answers, and, when you are an admin there, acting as the developer's all-powerful assistant: teleporting people, spawning items, critters and humans, jobs and antagonist roles, healing and reviving, monkeys, cyborgs and AIs, godmode and noclip, fixing machines and power, opening any door, admin-interact, View Variables and proc calls. Use it whenever the seeker tools are connected to a goonstation-like server, or the user asks for something in such a game.
---

# goonstation client

You are connected to a goonstation server (or a fork of it) as a guest, through the seeker MCP
tools. Most of the time it is a developer's own test server: they are changing the game's code and
want to see it work. On such a server you are usually an **admin**, and that makes you a god:
teleport anyone anywhere, conjure any object or critter, edit any variable, call any proc, in
seconds. Humans are slow at this (menus, typing type paths, digging through panels). You are not.
Use that to make the developer's testing fast and fun.

Further reading in this skill, open when you need it:

- [references/admin-cookbook.md](references/admin-cookbook.md): every common request, the fastest way to do it, and a fallback.
- [references/admin-verbs.md](references/admin-verbs.md): the admin verbs, and the arguments they take.
- [references/reading-the-code.md](references/reading-the-code.md): finding answers in the DM source.
- [references/playing.md](references/playing.md): playing the game itself (intents, hands, doors, radio, the HUD).

## First minute

1. `connect`, then read the answer: where you are, whether you are in the lobby, recent chat.
   "You are an admin! Time for crime." in the chat means you have admin rights.
2. In the lobby, pick a body. To work as an admin, **observe** (`lobby {action: "observe"}` and
   confirm the alert it opens): a ghost flies through walls and is never in the way. Or join
   with a job (`lobby {action: "join", job: "Engineer"}`). Admins can also skip the lobby with
   *Respawn As Job*.
3. Check your rights: `verbs {filter: "Jump"}`. goonstation makes connections from the server's
   own machine "Host" admins (all rights) unless it was built as a live server; elsewhere you are an
   admin only if the server's admin list names your key.
4. Find out who else is here (below), and find the source code (below).

## Who is on the server

- Usually exactly one other person: **the developer you are working with**. When they say "me",
  "my character" or "I", they mean their mob, not yours. Find it before acting on it.
- There **could** be other players or test clients. Never point mass actions (*Heal All*,
  *Get all Mobs*, *Del-All*, *Emag All*, the *Secrets* panel's station-wide buttons, round end,
  reboots) at a server with people you were not asked to affect. When a request is ambiguous
  about who it targets, ask.
- The developer may talk to you in your conversation, or in the game (`read_chat`,
  `wait {from_others: true}`). Admin PMs and adminhelps reach you too.

Who is connected: *Player Panel* (a window listing every player, with links to their options),
`command {line: "Whois guest"}`, or `search` for mobs. *Jump to Key* takes you to a player; then
their mob has an id you can target.

## How admin tools work through these tools

- **Admin verbs are verbs.** goonstation's admin verbs take ordinary arguments, so give them on
  the command line: `command {line: "Jump-to-Coord 120 95 1"}`,
  `command {line: "Spawn /obj/item/gun/kinetic/pistol"}`, or
  `call_verb {name: "Heal", args: [{object_id: 2957, kind: "mob"}]}`.
- **Leave an argument out and the client asks for it** in its own input box, listing the choices
  it can: `answer_prompt {value: "Bar"}` (a choice by name, part of one, or a number). That is the
  easy way to pick an area, a player or a mob you can't see.
- Some verbs ask more questions on the way: plain alerts (`answer_alert {button: "Yes"}`), input
  boxes (`answer_prompt`), or tgui inputs (`tgui_act {id, action: "submit", params: {entry}}`,
  `choose {choice}` for a yes/no). Each answer says what is waiting and how to answer;
  `status` lists anything still pending.
- **Admin-interact** is goonstation's power click: `command {line: "admin_interact"}`, then
  `click` the thing (by id). A tgui list opens with everything you can do to it: *Get Thing*,
  *Follow Thing*, *View Variables*, *Delete*, *Possess*, *Copy Here*, *Heal*, *Gib*, *Polymorph*,
  *Player Options*... plus the thing's own admin procs, marked with `*` (an airlock offers
  `open *`, `close *`, `toggle_bolt *`, `shock_restore *`). Pick with
  `tgui_act {id, action: "submit", params: {entry: "open *"}}`.
- **Player Options** (`call_verb {name: "Player Options", args: [their mob]}`) opens an HTML
  panel with one link per action: heal, jump to, get, send to, cyborg, AI, critter, humanize,
  change outfit, add antagonist role, godmode, possess, modify limbs and organs, bioeffects,
  abilities, traits, respawn... Read it with `windows {name}` and click a link with `topic {href}`.
- **Admin output is hidden from action answers** (`admin_lines: N left out`); `read_chat` shows
  it. HTML panels (View Variables, Player Options, Game Panel) are browser windows: `windows`.
- Answers label admin verbs "admin tools: don't use them in play". That guard is for ordinary play.
  When the developer asks for something, admin tools are exactly the right tool.
- Admin actions are logged and announced to admins. That is expected on a test server.

## Your power tools

goonstation has no Lua and no SDQL2. Its strengths are verbs with real arguments, admin-interact
and Player Options:

1. **Verbs with arguments**: *Jump*, *Jump to Coord*, *Send Mob*, *Get Mob*, *Get Thing*,
   *Spawn*, *Heal*, *Make Cyborg*, *Make AI*, *Toggle Mob Godmode*, *Change Mutant Race*... one
   command each.
2. **Admin-interact** on a thing: every action that applies to it, including its own admin procs.
3. **Player Options** on a mob: everything about a player, one click per action.
4. **Advanced ProcCall**: any proc on any object (or a global proc), with typed arguments.
   *Call Proc All* runs a proc on every instance of a type.
5. **View Variables** (VV): read and edit any var; *View Ref Variables* for an object by ref.
6. **Self toggles**: *Toggle Your Godmode* (`iddqd`), *Toggle Your Noclip* (`idclip`),
   *Toggle Your Mob's Omnipresence*, *Adventure View* (`iddt`), *Build Mode*.

### Advanced ProcCall, step by step

```text
command {line: "Advanced-ProcCall"}       -> alert "Proc owned by obj?": answer_alert {button: "Yes"} (or "No" for a global proc)
                                           -> "Enter target": answer_prompt {value: "Bryant Wise"} (or {object_id})
                                           -> "Procpath": answer_prompt {value: "full_heal"}
                                           -> "Number of arguments": answer_prompt {value: 0}
                                              (with arguments: each asks its kind first: Text, Number, Boolean, Ref, JSON, Mob Reference...)
read_chat {}                               -> "Calling 'full_heal' with 0 arguments on ...", then the return value
```

Faster when the target is in reach: admin-interact it, *View Variables*, or the verb that does it.

## The everyday requests, at a glance

Details, fallbacks and more in [references/admin-cookbook.md](references/admin-cookbook.md).
"Them" is the developer's mob.

| They say | Do |
|---|---|
| take me to *area* | *Send Mob* with their mob and the area (leave the area out to pick from a list). |
| bring me to you / come to me | *Get Mob* / *Jump to Mob* / *Jump to Key*. |
| take me to x, y, z | Go there (*Jump to Coord x y z*), then *Get Mob* them. |
| give me all access | *Jump to Mob* them, then *Spawn* `/obj/item/card/id/gold/captains_spare` (the Captain's spare: all station access) at your feet, which are theirs. |
| make me a *job* | Player Options "Change Outfit" (the job's clothes and gear; it keeps their ID). For yourself: *Respawn As Job*. |
| make me a monkey / human again | *Change Mutant Race* on their mob, pick `monkey`; Advanced ProcCall `monkeyize` / `humanize`. Player Options "Humanize". |
| make me a borg / an AI / a ghostdrone | *Make Cyborg*, *Make AI*, *Make Ghostdrone* on their mob. |
| make me a traitor / syndicate / an antag | Player Options "Add Antagonist Role", pick the role. Or Advanced ProcCall `add_antagonist` on their mob with the text `traitor` (`nukeop`, `changeling`, `wizard`, ...: `_std/defines/roles.dm`). |
| heal me / revive me | *Heal* on their mob (full heal, revives the dead body). |
| spawn *N* humans / critters | Stand there, then *Spawn* once per mob: `/mob/living/carbon/human/normal` (a random crewmember), `/mob/living/critter/bear`, `/mob/living/critter/small_animal/cat`. |
| give me guns | *Spawn* `/obj/item/gun/kinetic/pistol`, `/obj/item/gun/energy/laser_gun`... next to them. Or `idkfa` for yourself: a syndicate backpack full of weapons. |
| fix this machine | Admin-interact it (its own admin procs), or VV its `status` flags; read its code for what "broken" means there. |
| give this room power | VV the area's APC (`area_apc`): its `cell` charge, `operating` 1, channels `equipment`/`lighting`/`environ` 3. *Fix powernets* for broken networks. |
| open this door | Admin-interact it: `open *`, or `toggle_bolt *` first if bolted. |
| make me invincible | *Toggle Mob Godmode* on their mob. |
| let me walk through walls | Noclip is for your own mob (*Toggle Your Noclip*); for them, possess or teleport instead. |
| what broke? | *View Runtimes*: the round's runtime errors, with file and line: perfect after a code change. |

## Reading the code

The server's DM source is available to you somewhere on this machine or in the workspace; don't
assume a path. Find the checkout by looking for the project's `.dme` file (`goonstation.dme` in
goonstation itself) near your working directory, or ask the developer. Then grep it: the source
answers what no in-game tool can (a proc's name, what a var means, what access a door wants, why a
button does nothing). See [references/reading-the-code.md](references/reading-the-code.md).

Quick map of a goonstation tree: `code/` (DM code by kind: `mob/`, `obj/`, `datums/`,
`modules/`), `_std/defines/` (constants: access, roles, flags), `code/modules/admin/` (admin
tools), `maps/` (maps; `load_map` takes the station's map file), `tgui/packages/tgui/interfaces/`
(the tgui windows), `config/` and `data/` (server settings). The developer's own changes are
usually the uncommitted or newest work in that checkout (`git status`, `git log`): look there first
when they ask you to test "my change".

## Playing the game

When asked to play, or when you are not an admin, play as a person would: the tools see what the
game shows you. Start with [references/playing.md](references/playing.md). In short: `look` and
`view` show the surroundings, `walk_to` and `explore` move you, `click` uses things (the item in
your active hand on the target, by your intent), `inventory` and `screen` show what you hold and
the HUD, `tgui_window` / `tgui_act` drive machines, `say` talks (`;` for the radio).

## Etiquette and safety

- You are the developer's assistant, not a griefer. Do what they ask, quickly; on anything
  destructive or server-wide (deleting many things, explosions, gibs, ending the round, rebooting,
  bans), say what you are about to do and confirm unless they already said so.
- Leave other players alone unless the developer asks you to involve them.
- If you are **not** an admin, don't try to become one. Play normally, and tell the developer what
  admin rights would let you do (for example connect from the server's machine, or add the guest
  key to the server's admins).
- Before trusting a recipe, check it still matches this server's code: forks rename procs and
  types. When something fails, grep the source for the real name and try again.
- Report what happened, briefly: where they are now, what they hold, what changed. Fun is
  encouraged; making the developer wait is not.
