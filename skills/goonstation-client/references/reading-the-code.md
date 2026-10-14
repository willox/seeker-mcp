# Reading goonstation's code

The server's DM source answers what the game won't tell you: a proc's real name, what a var means,
what access a door wants, why a button does nothing, what an admin verb asks for. Read it before
guessing, and especially before a proc call or a variable edit on a fork.

## Finding the checkout

Don't assume a path. The checkout is the folder with the project's `.dme` file
(`goonstation.dme` in goonstation itself; forks keep the name or use their own) next to `code/`,
`_std/`, `maps/` and `tgui/`. Look in and above your working directory
(`find . -maxdepth 3 -name '*.dme'`), or ask the developer. When several are present, the one the
server runs is the one whose `.dmb` is newest, or the one the developer names.

## The layout

| Path | What |
|---|---|
| `_std/` | Defines and macros: `_std/defines/` (access, roles, admin categories, speech prefixes...), `_std/machinery.dm` (machine status bits), `_std/macros/`. |
| `code/mob/` | Mobs: `living/carbon/human/` (humans, their job subtypes, monkeys), `living/critter/` (animals and monsters), `living/silicon/` (borgs, the AI, drones), `dead/observer.dm` (ghosts), `transform_procs.dm` (monkeyize, humanize, AIize, critterize). |
| `code/obj/` | Objects: `item/` (items, guns, cards), `machinery/` (machines, doors), `storage/`, `structure/`. |
| `code/datums/` | Datums: minds, abilities, bioeffects, components, controllers. |
| `code/modules/` | Everything by feature: `admin/`, `antagonists/`, `power/` (APCs, SMES), `atmospherics/`, `chemistry/`, `medical/`, `mechanics/`, `hydroponics/`, `mining/`, `vending/`... |
| `code/modules/admin/` | Admin tools: `admin_verbs.dm` (which verbs each admin level gets), `admin.dm` (the Topic handlers behind panel links, *Spawn*), `player_options.dm` (the Player Options panel), `debug.dm` (proc calls), `viewvariables/`, `randomverbs.dm`, `toggles.dm`. |
| `code/procs/` | Global procs: `access.dm` (`get_access(job)`, `get_all_accesses()`), helpers. |
| `code/area.dm`, `code/turf/` | Areas (each knows its `area_apc`) and turfs. |
| `maps/` | Station maps (`.dmm`: cogmap2, atlas, donut3, kondaru...) and their configs. `load_map` takes the map the server runs (the stat panel or the server's map config names it). |
| `tgui/packages/tgui/interfaces/` | The tgui windows' code: what each button sends (`act('name', {...})`). |
| `config/`, `data/` | Server settings (`config/config.txt`, `admins.txt`), saved state, `data/mode.txt` (the game mode). |
| `strings/` | Text tables. |

## Grep recipes

```sh
grep -rn '^/obj/machinery/door/airlock/proc/' code/              # procs of a type
grep -rn 'ADMIN_INTERACT_PROCS(/obj/machinery' code/              # what admin-interact offers per type
grep -rn 'name = "fire extinguisher"' code/                       # a type from its in-game name
grep -rn 'set name = "Send Mob"' code/                            # an admin verb's code
grep -rn '"sendmob"' code/modules/admin/admin.dm                  # what a Player Options link does
grep -rn '#define ROLE_' _std/defines/roles.dm                     # antagonist role ids
grep -rn 'You can.t reach' code/                                  # where a message comes from
grep -rn 'ui_act' code/modules/vending/vending.dm                  # a machine's tgui actions
```

- goonstation often declares procs inside the type's block (`proc/open()` indented under
  `/obj/machinery/door`), not as `/obj/machinery/door/proc/open()`: grep for both forms, or for
  `proc/open(`.
- A type's vars are inherited: read up the path.
- `ADMIN_INTERACT_PROCS(type, proc/a, proc/b)` lists the procs admin-interact offers on that type
  (marked `*` in its menu).

## Testing the developer's change

1. `git status`, `git diff`, `git log -5` in the checkout: what changed, which files, which types.
2. Find how to reach it in the game: the type's in-game name, where it's mapped (grep the `.dmm`
   files for the path) or how it's made (manufacturers, vendors, recipes).
3. Set the scene with admin tools (spawn it, jump there, give access), use it the way a player
   would, and watch `read_chat`, the tgui window and *View Runtimes*.
4. Report what you saw: what worked, what didn't, the runtime's file and line if there was one.
