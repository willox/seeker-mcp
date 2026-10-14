# The admin cookbook (tgstation)

Every recipe assumes you are an admin (see SKILL.md, "First minute"). "Them" is the person who
asked, usually the developer; find their mob first (the Lua preamble in
[lua-and-sdql.md](lua-and-sdql.md), or *Jump To Key*). Verb names are tgstation's; on a fork,
`verbs {filter: "..."}` finds the local name and the source has the rest.

How the pieces are called (details in SKILL.md):

- `command {line: "Verb-Name"}` runs a verb; tgui windows then ask for its arguments:
  `tgui_act {id, action: "submit", params: {entry}}`, or `choose {choice}` for a yes/no.
- A verb on a thing: `call_verb {name, args: [{object_id, kind}]}`, or the verb alone and
  `answer_prompt {value: "Name"}` from the client's list.
- Lua: `command {line: "Open-Lua-Editor"}`, then `runCode` (see lua-and-sdql.md).

## Getting around

| Request | Fastest | Fallback |
|---|---|---|
| Take me (you) to an area | *Jump To Area*, pick from the list | `walk_to {area}` as a ghost (no walls for ghosts) |
| Take *them* to an area | *Send Mob*: their mob, then the area | Lua `area_named` + `m:forceMove(tile)` |
| Go to them | *Jump To Key* (pick their key) or *Jump To Mob* | Ghost verb *Orbit* (follows them) |
| Bring them to you | *Get Key* / *Get Mob* | Lua `m:forceMove(dm.usr.loc)` |
| A coordinate | *Jump To Coordinate* (x, y, z boxes) | Lua `forceMove(P._locate(x, y, z))` |
| A ruin, away mission, lazy template | *Jump to Ruin*, *Load/Jump Lazy Template* | |
| Back into your body after ghosting | *Jump To Ghost* moves your body to you; ghost verb *Re-enter Corpse* | |

As a ghost you fly through walls; `walk_to` and `explore` work and nothing blocks you. *AGhost* leaves
your body behind without giving it up (Do-Not-Resuscitate is not set).

## Bodies

| Request | Do |
|---|---|
| Heal me / revive me / I'm dead | *Rejuvenate* on their **body**, dead or alive (not their ghost: a ghost's body is Lua `ghost.mind.current`). Lua `m:revive(16777215)`. |
| Make me invincible | Lua `P._add_trait(m, "godmode", "admin")`; the Player Panel has a godmode toggle. |
| Make me a monkey / human | Lua `m:monkeyize()` / `m:humanize()` (Player Panel buttons too). |
| Make me a cyborg | *Make Cyborg* on their mob, or Lua `m:Robotize()`; *Show Borg Panel* edits a borg's modules. |
| Make me the AI | Lua `m:AIize()` (an AI core where they stand). |
| Make me a lizard / moth / ... | Lua `m:set_species(SS13.type("/datum/species/lizard"))` (`code/modules/mob/living/carbon/human/species_types/`). |
| Make me a corgi / gorilla / xeno / slime | Lua `m:corgize()`, `m:gorillize()`, `m:Alienize()`, `m:slimeize()`. Or *Spawn* the mob and *Give Direct Control*. |
| Put me in that body | *Give Direct Control*: the body, then their client. You yourself: *Assume Direct Control*. |
| Possess that object | *Possess Obj* puts *you* in it (*Release Object* ends it); for them, *Give Direct Control* of a mob. |
| Remove my handcuffs / restraints | *Rejuvenate* (the admin heal clears restraints), or *Drop Everything*. |
| Organs, diseases, mutations, spells | *Manipulate Organs*, *Give Disease*, View Variables "Edit DNA"/mutations, *Give Spell*, *Give Mob Action*. |
| Skills and experience | *Show Skill Panel*. |
| Kill / gib / smite | *Gib*, *Smite* (a menu of divine punishments). Only when asked. |

## Jobs, access and roles

| Request | Do |
|---|---|
| All access | *Grant Full Access* on their mob (round must have started). Or hand them `/obj/item/card/id/advanced/debug`. |
| *Job* access (e.g. engineering) | Lua: `SSid_access:apply_trim_to_card(m:get_idcard(), SS13.type("/datum/id_trim/job/chief_engineer"))`. Trims: `code/datums/id_trim/`. |
| Make me the captain / a doctor | *Select Equipment* on their mob: the job's outfit ("Captain", "Medical Doctor") dresses them and gives that ID. Lua `m.mind:set_assigned_role(dm.global_vars.SSjob:get_job("Captain"))` for the job record. |
| Debug kit | *Select Equipment* "Debug outfit" (all-access ID, debug tools, a MODsuit) or "Admin outfit". |
| Traitor / syndicate / an antag | Lua `m.mind:add_antag_datum(SS13.type("/datum/antagonist/traitor"))`; or *Show Traitor Panel* on their mob and use its buttons. |
| Nuke op, changeling, heretic, cultist, wizard, revolutionary... | Same, with `nukeop`, `changeling`, `heretic`, `cult`, `wizard`, `rev/head`, `malf_ai`, `brother`, `ninja`, `spy`, `obsessed`. Grep `^/datum/antagonist/` for more. |
| Uplink / telecrystals | Traitors get an uplink with the datum; *Spawn* `/obj/item/uplink/debug` for a stocked one (more in `code/modules/uplink/`). |
| Who is an antag? | *Check Antagonists*. |
| Remove a role | Lua `m.mind:remove_antag_datum(SS13.type(path))`, or the traitor panel. |
| Open job slots | *Manage Job Slots*. |

## Spawning

| Request | Do |
|---|---|
| Spawn an item / mob at my feet | Stand there, *Spawn*, type the path. `path:amount` spawns several (cap 100). A partial path opens the spawn panel to pick from. |
| Spawn it next to them | Jump to them first, or Lua `SS13.new(path, m.loc)`. |
| Give it to them, in hand | Lua `m:put_in_hands(SS13.new(path, m.loc))` (a `0` means it fell at their feet). |
| *N* humans | *Spawn* `/mob/living/carbon/human:N`; dress them with *Select Equipment*; *Spawn Debug Full Crew* fills every job. |
| *N* NPCs | *Spawn* a basic mob: `/mob/living/basic/carp:5`, `/mob/living/basic/trooper/syndicate`, `/mob/living/basic/pet/dog/corgi`. Grep `^/mob/living/basic/` for the zoo. |
| Guns | `/obj/item/gun/energy/e_gun`, `/obj/item/gun/energy/laser`, `/obj/item/gun/ballistic/automatic/pistol`, `/obj/item/gun/ballistic/shotgun/riot`, `/obj/item/gun/energy/pulse`. Grep `^/obj/item/gun/` for all. |
| Tools / materials | `/obj/item/storage/belt/utility/full`, `/obj/item/storage/box/debugtools`, `/obj/item/construction/rcd/combat/admin`, `/obj/item/stack/sheet/iron/fifty`, `/obj/item/stack/sheet/glass/fifty`. |
| A crate of something | *Spawn Cargo* (a cargo pack), *PodSpawn* (drop it in a supply pod), *Config/Launch Supplypod*. |
| Reagents | *Spawn Reagent Container*; View Variables "Add reagent" on a container. |
| A whole room / structure | *Map Template - Place*, *Spawn Ruin*; *Toggle Build Mode Self* to paint turfs and objects with clicks. |
| Delete it | *Delete* on the thing; *Del-All* for every one of a type (server-wide: confirm first). |

## Machines, doors, power, atmosphere

| Request | Do |
|---|---|
| Open this door | Lua `d:unbolt(); d.welded = 0; d:open(2)` (2 = BYPASS_DOOR_CHECKS). Or *Toggle Admin AI Interact* and click the airlock as a ghost: you get the AI's panel (open, bolts, shock). |
| Open every door around me | SDQL `CALL open(2) ON /obj/machinery/door/airlock WHERE loc.loc == usr.loc.loc` (this room), after a `SELECT`. |
| Lock / bolt it | Lua `d:bolt()`. |
| Fix this machine | Lua `mc:repair_damage(mc.max_integrity); mc:set_machine_stat(0)`; *Tweak Component Ratings* upgrades its parts. For anything else, read its code (what `machine_stat` flags, parts or wires it checks). |
| Power this room | Lua: the area's `apc`, `apc.cell:give(apc.cell:max_charge())`, `apc.operating = 1`, `apc:update()`. |
| Power the whole station | *Secrets* window, action `power` (all APCs and SMES charged); Lua `P.power_restore()`. |
| Rebuild broken power networks | *Make Powernets*; *Check Power* reports problems. |
| Fix the air | *Fix Air* (a radius around a turf); *Atmos Control Panel*. |
| Gravity off | *Secrets* `fix_gravity`. |
| Lights, cameras, intercoms coverage | *Camera Range Display*, *Intercom Range Display*, *Toggle Light Debug*. |

To drive the *Secrets* panel: `command {line: "Secrets"}`, then `tgui_window {id}` lists its
actions; `tgui_act {id, action: "power"}`.

## The round and the server

| Request | Do |
|---|---|
| Start the round now | *Start Now* (in the lobby phase). |
| Delay / end the round | *Delay Pre-Game*, *Delay Round End*, *End Round*. Confirm first. |
| Call / recall the shuttle | *Call Shuttle*, *Cancel Shuttle*, *Shuttle Manipulator*. |
| Trigger an event (meteors, anomalies...) | *Trigger Event*; *Run Weather*; *Toggle Random Events*. |
| Set the alert level | *Set Security Level*. |
| Announce something | *Announce*, *Create Command Report*, *Global Narrate*, *Local Narrate*, *Subtle Message*. |
| Restart the server | *Reboot World*. Confirm first; you will be disconnected (`connect` again after). |
| Reload config | *Reload Configuration*. |
| Change the next map | *Change Map*. |

## Debugging help for the developer

| Request | Do |
|---|---|
| Did my change break anything? | *View Runtimes*: runtime errors this round, with file, line and count. |
| What happened to X? | *Investigate* (logs by category), *Get Current Logs*, *View Round Logs*, *List Bombers*, *List Signalers*. |
| What are this thing's vars? | *View Variables* on it (an HTML window: `windows {name}`, `topic` to edit), or Lua `print(thing.var)`. |
| Call a proc on it | *Atom ProcCall* on the thing (asks the proc name, then each argument), *Advanced ProcCall* for global procs. Lua is quicker. |
| How many of X exist? | *Count Objects All*, *Count Objects On Z-Level*, *Count Atoms/Datums*; SDQL `SELECT`. |
| Is the server lagging? | *Controller Overview*, *Debug Controller*, *Show Lag Switches*; Lua `print(dm.world.cpu)`. |
| Test mobs to fight | *Spawn* basic mobs, or *Populate World*. |
| Test pathfinding, AI | *Toggle Pathfind Testing*, *View Behavior Tree*, *Give AI Controller*. |
| Make test crew | *Spawn Debug Full Crew*. |

## When something doesn't work

- "You lack the permissions to do this." Your rank lacks that right (a remote admin rank). Ask
  the developer; don't try to get round it.
- A verb isn't in `verbs`: some are hidden behind a visibility switch (mapping and debug verbs:
  *Enable Mapping Verbs*), others only exist when configured. Grep the source for its name.
- A window answered nothing: check `status` for `pending_tgui_inputs` or `pending_prompts`; the
  game may be waiting for you.
- Lua errors name the line; a `nil` usually means a var or proc has another name on this server:
  grep for it.
