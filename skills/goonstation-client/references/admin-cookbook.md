# The admin cookbook (goonstation)

Every recipe assumes you are an admin (see SKILL.md, "First minute"). "Them" is the person who
asked, usually the developer; find their mob first (*Player Panel*, *Jump to Key*, `search`).
Verb names are goonstation's; on a fork, `verbs {filter: "..."}` finds the local name and the
source has the rest.

How the pieces are called (details in SKILL.md):

- Verbs take ordinary arguments: `command {line: "Verb-Name arg1 arg2"}` or
  `call_verb {name, args: [...]}`; leave one out to pick it from the client's list
  (`answer_prompt {value}`).
- **Admin-interact**: `command {line: "admin_interact"}`, `click` the thing, pick from the list
  with `tgui_act {id, action: "submit", params: {entry}}`.
- **Player Options** on a mob: an HTML panel; `windows {name}` lists its links, `topic {href}`
  clicks one.
- **Advanced ProcCall**: any proc, answered box by box (SKILL.md).

## Getting around

| Request | Fastest | Fallback |
|---|---|---|
| Take me (you) to an area | *Jump* (pick the area) | `walk_to {area}` as a ghost |
| Take *them* to an area | *Send Mob*: their mob, then the area | *Send all Human Mobs* (everyone: only when asked) |
| Go to them | *Jump to Key* / *Jump to Mob* (`JTK`, `JTM`) | *Follow Thing* (keeps following) |
| Bring them to you | *Get Mob*; *Get Thing* works on mobs and objects | *Get Thing (Location)* puts it in your location (a locker you are in, a vehicle) |
| A coordinate | *Jump to Coord x y z* (`JTC`) | *Jump To Turf* (`JTT`) on a turf you know |
| Walk through walls | *Toggle Your Noclip* (`idclip`) | Observe and fly as a ghost |
| Back into your body | ghost verb *Re-enter Corpse*; *Respawn As Self* makes a new body | |

## Bodies

| Request | Do |
|---|---|
| Heal me / revive me | *Heal* on their **body** (full heal, dead or alive; not their ghost). *Heal All* heals everyone. Player Options "Heal". |
| Stabilize (stop dying, not a full heal) | Admin-interact their mob: *Stabilize*. |
| Make me invincible | *Toggle Mob Godmode* on their mob (its message reports *your* godmode state, a goonstation quirk: check `nodamage` with View Variables). Yourself: *Toggle Your Godmode* (`iddqd`). |
| Make me a monkey | *Change Mutant Race* on their mob, pick `monkey` (the list is every mutant race: lizard, cow, skeleton, ...). Advanced ProcCall `monkeyize` works too. |
| Human again | *Humanize* (or *Change Mutant Race* back to none), Player Options "Humanize". |
| Make me a cyborg / AI / ghostdrone | *Make Cyborg*, *Make AI* (*Mobile AIize* for a mobile one), *Make Ghostdrone* on their mob. *Edit Module* for a borg's tools. |
| Make me a critter | Player Options "Make Critter" (pick the critter type). |
| Swap bodies / put me in that body | *Swap Bodies With* (you and them); *Transfer Client To* (their client into a mob); Player Options "Possess mob". |
| Change how I look | *Polymorph Player*, Player Options "Edit Appearance"; *Randomize Appearance* for yourself. |
| Limbs, organs, bioeffects, abilities, traits | *Modify Organs*, Player Options "Modify Limbs/Organs"; *Manage Bioeffects*; *Manage Abilities*; Player Options "Manage" traits. |
| Remove handcuffs | *unhandcuff player*; *Drop Everything*. |
| Kill / gib / smite | *Gib* (and its many flavours: *Owl Gib*, *Party Gib*...), *Smite*. Only when asked. |

## Jobs, access and roles

| Request | Do |
|---|---|
| All access | *Jump to Mob* them, *Spawn* `/obj/item/card/id/gold/captains_spare` (all station access): it lands at your feet, which are theirs. They put it in their ID slot. |
| A job's outfit | Player Options "Change Outfit": pick the job; their ID stays. For yourself, *Respawn As Job* (a new body with that job, ID included). |
| A job's access on their ID | The ID computer (head of personnel's office: insert the captain's spare and their ID). Or View Variables on the ID: its `access` list. Access names: `_std/defines/access.dm`, per job: `get_access()` in `code/procs/access.dm`. |
| Traitor / syndicate / an antag | Player Options "Add Antagonist Role", pick the role. Or Advanced ProcCall on their mob: `add_antagonist`, one Text argument `traitor`. |
| Other roles | Role ids in `_std/defines/roles.dm`: `traitor`, `nukeop`, `changeling`, `wizard`, `vampire`, `werewolf`, `arcfiend`, ... Player Options lists the ones this server offers. |
| Remove a role | Player Options "Remove" next to it, "Remove All Antagonist Roles". |
| Force a job or role for next round | *Forced Assignment Panel*. |
| Job slots | *Job Controls*. |

## Spawning

| Request | Do |
|---|---|
| Spawn an item / mob at my feet | *Spawn* `<path>`: a partial path is enough when it matches one type (`Spawn pistol`), otherwise it asks which. A turf path replaces the floor you stand on. |
| Spawn it next to them | Jump to them first (*Jump to Mob*), then *Spawn*. |
| Spawn it with style | *Spawn-Heavenly*, *Spawn-Demonically*, *Spawn-Supplydrop*. |
| *N* humans | *Spawn* `/mob/living/carbon/human/normal` once per human (random crew; `/mob/living/carbon/human/normal/assistant` and other job subtypes come dressed). |
| *N* critters | *Spawn* `/mob/living/critter/bear`, `/mob/living/critter/spider`, `/mob/living/critter/small_animal/cat`, ... Grep `^/mob/living/critter/` for the zoo. NPC humans: `/mob/living/carbon/human/npc`. |
| Guns | `/obj/item/gun/kinetic/pistol`, `/obj/item/gun/energy/laser_gun`, `/obj/item/gun/energy/taser_gun`, `/obj/item/gun/kinetic/riot40mm`; grep `^/obj/item/gun/` for all. For yourself, `idkfa`: a syndicate backpack of weapons. |
| Tools | `/obj/item/storage/belt/utility/prepared`, `/obj/item/storage/toolbox/mechanical`, `/obj/item/device/multitool`, `/obj/item/rcd`, `/obj/item/card/emag`; *spawn_survival_shit* for a survival kit. |
| Medicine | `/obj/item/storage/firstaid/regular`; *Add Reagent* to a container or mob. |
| One of every subtype | *Spawn All Of A Type* (careful: some types have hundreds). |
| Copy that thing | Admin-interact it: *Copy Here*. |
| Delete it | *Delete*, or admin-interact *Delete*; *Del-All* / *Del-Half* by type (server-wide: confirm first). |
| Build | *Build Mode* (click to place and edit). |

## Machines, doors, power, atmosphere

| Request | Do |
|---|---|
| Open this door | Admin-interact it: `open *` (bolted: `toggle_bolt *` first; electrified: `shock_restore *`). |
| Open many doors | *Call Proc All* with the type and proc name (`/obj/machinery/door/airlock`, `open`): every airlock on the server; confirm first. *Unelectrify All Airlocks* exists too. |
| Fix this machine | Admin-interact it for its own procs; View Variables its `status` (the `BROKEN` = 1 and `NOPOWER` = 2 bits: `_std/machinery.dm`) and health vars; read its code for what "broken" means for it. |
| Power this room | View Variables on the room's APC (the area's `area_apc`): fill `cell` charge to its `maxcharge`, `operating` 1, `equipment`, `lighting` and `environ` 3. |
| Power networks broken | *Fix powernets*; *Machine Power stats* to see the load. |
| Bad air | *Stabilize Atmos* (every turf in view), *Stabilize All Atmos* (the station). |
| Lights | *Lights Out* (off, for a while), *Disco Lights*. |
| Emag something | Admin-interact; *Emag Type*, *Emag All* (everything: almost never). |

## The round and the server

| Request | Do |
|---|---|
| Start the round now | *Start Now*. |
| Delay the start / the end | *Delay Round Start*, *Delay Round End*. |
| Restart | *Restart* (confirm first; you'll reconnect after). |
| Announce something | *Announce*, *Command Report Panel*, *Plain Message to All*, *Subtle Message*. |
| Events | *Event Controller*, *Custom Ghost Spawn*, *Special Shuttle*. |
| Server switches | The Server Toggles tab: OOC, respawn, suicide, AI, entering... (each is a verb). |

## Debugging help for the developer

| Request | Do |
|---|---|
| Did my change break anything? | *View Runtimes*: runtime errors this round. |
| What are this thing's vars? | *View Variables* on it, *View Ref Variables* for a ref, *View Global Variable*. |
| Call a proc | *Advanced ProcCall* (on a thing or global), *Call Proc All* on a type. |
| Where is it? | *Find Thing*, *Find One*, *Find All*, *Count All* (by type); `search` for what you've seen. |
| Bring all of a type here | *Get Type* (not for turfs or areas). |
| Replace or transmute things | *Replace Type*, *Transmute Type*. |
| Profiling and lag | *Machine stats*, *Queue stats*, *Main Loop Tick Detail*, *Ticklag*. |
| See hidden things | *Adventure View* (`iddt`), *Toggle Your Mob's Omnipresence*, *View Admin Minimap*, *Info Overlay*. |

## When something doesn't work

- "You cannot perform this action. You must be of a higher administrative rank!": your rank lacks
  it. Ask the developer; don't try to get round it.
- A verb isn't in `verbs`: it may be for a higher rank, behind *Toggle Extra Verbs* or *Toggle
  Atom Verbs*, or compiled out. Grep the source for its name.
- Nothing happened: check `status` for pending alerts, prompts or tgui inputs; the game may be
  waiting for an answer.
