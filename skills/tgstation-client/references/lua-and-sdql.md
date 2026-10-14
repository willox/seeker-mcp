# Lua and SDQL2 on tgstation

Both need admin rights with debug permissions (a localhost admin has them). Lua also needs the
server to load its Lua library (`dreamluau`); if *Open Lua Editor* isn't among your verbs, use
SDQL2 or proc calls.

## Running Lua

```text
command     {line: "Open-Lua-Editor"}
tgui_act    {id, action: "newState",    params: {name: "agent"}}     # first time this round
tgui_act    {id, action: "switchState", params: {index: 1}}          # later: states survive reconnects
tgui_act    {id, action: "runCode",     params: {code: "..."}}
tgui_window {id, path: "data.stateLog"}                               # read the newest entries
```

Each run adds entries to `data.stateLog`: one `print` entry per `print(...)` (tab-separated
values), then `finished` with `return_values`, or an error with its message. The log keeps growing;
read its end, or `tgui_act {id, action: "nukeLog"}` to clear it. A script is cut off after
5 seconds of run time; `sleep()` or `SS13.wait(seconds)` yields and resumes later.

Language notes:

- Luau. Lists from DM iterate with `for _, v in list do ... end`; `#list` is its length; indexes
  start at 1. Assoc lists read as `list[key]`.
- Vars: `thing.var` and `thing.var = value`. Procs: `thing:proc(args)`. A var hidden by a proc of
  the same name: `dm.get_var(thing, "name")`.
- Globals: `dm.global_vars.GLOB.clients`, `dm.global_vars.SSticker`; global procs:
  `dm.global_procs.qdel(thing)`, `dm.global_procs.to_chat(mob, "hi")`. Built-ins are wrapped with
  a leading underscore: `_locate`, `_get_step`, `_range`, `_view`, `_istype`, `_typesof`,
  `_text2path`, `_add_trait`, `_remove_trait`, `_has_trait`.
- **DM's `FALSE` and `0` are true in Lua** (only `nil` and `false` are false). Compare numbers:
  `if t.density == 0`, `if m:put_in_hands(it) == 0`, never `if not t.density`.
- A var and a proc with the same name: the dot gives the proc. Power cells are the common case:
  `cell:charge()` and `cell:max_charge()` read them, `dm.get_var(cell, "charge")` reads the var.
- `#define` constants don't exist at run time. Look up the value in `code/__DEFINES/` and use the
  number or string (a trait's define is its string: `TRAIT_GODMODE` is `"godmode"`).
- `local SS13 = require("SS13")` gives `SS13.new(path, ...)`, `SS13.type(path)`,
  `SS13.istype(thing, path)`, `SS13.qdel(thing)`, `SS13.is_valid(thing)`,
  `SS13.get_runner_client()`, `SS13.get_runner_ckey()`, `SS13.wait(s)`,
  `SS13.set_timeout(s, fn)`, `SS13.start_loop(s, n, fn)`, `SS13.register_signal(...)`.
  The server's own docs: `code/modules/admin/verbs/lua/README.md` and the `lua/` folder.

### The preamble

Paste this at the top of a script: it finds the developer and their mob.

```lua
local SS13 = require("SS13")
local G = dm.global_vars.GLOB
local P = dm.global_procs
local me = dm.usr
-- the first connected client that isn't you; pass part of a ckey or a name to pick another
local function who(part)
  for _, c in G.clients do
    if c.ckey ~= SS13.get_runner_ckey() and (not part or string.find(c.ckey, part, 1, true)
        or string.find(string.lower(c.mob.name), string.lower(part), 1, true)) then
      return c
    end
  end
end
local them = who()
local m = them and them.mob
```

### Recipes

Moving people and things:

```lua
m:forceMove(P._locate(120, 95, 2))                       -- to a tile
m:forceMove(me.loc)                                      -- to you
-- into an area by name: an exact name first, then a part of one ("bar" matches "Bar Lounge" too)
local function area_named(name)
  name = string.lower(name)
  local best
  for _, a in G.areas do
    local n = string.lower(a.name)
    if n == name or n == "the " .. name then best = a break end
    if not best and string.find(n, name, 1, true) then best = a end
  end
  return best
end
local function open_tiles(area)
  local tiles = {}
  for _, t in area:get_turfs_from_all_zlevels() do if t.density == 0 then table.insert(tiles, t) end end
  return tiles
end
local tiles = open_tiles(area_named("bar"))
m:forceMove(tiles[math.ceil(#tiles / 2)])
```

(`get_turfs_from_all_zlevels` is in `code/game/area/areas.dm`; if a fork lacks it, use
*Send Mob*, which prompts with the area list.) By type: `G.areas_by_type[SS13.type("/area/...")]`.

Bodies and health:

```lua
m:revive(16777215)             -- ADMIN_HEAL_ALL (= ALL = ~0); check code/__DEFINES/mobs.dm on forks
m:fully_heal()                 -- heals a living mob (doesn't bring back the dead: use revive or Rejuvenate)
m:monkeyize()   m:humanize()   -- carbon mobs
m:Robotize()    m:AIize()      -- into a cyborg / the AI
m:set_species(SS13.type("/datum/species/lizard"))
P._add_trait(m, "godmode", "admin")      P._remove_trait(m, "godmode", "admin")
m:gib()                        -- only when asked
```

Prefer the *Rejuvenate* verb to `revive` when their mob is within reach: it uses the right flags
for this server.

Items in hand:

```lua
for _, path in {"/obj/item/gun/energy/e_gun", "/obj/item/gun/ballistic/automatic/pistol"} do
  local it = SS13.new(path, m.loc)
  if m:put_in_hands(it) == 0 then print("at their feet:", it.name) end
end
```

Kits worth knowing: `/obj/item/storage/box/debugtools`, `/obj/item/debug/omnitool`,
`/obj/item/storage/belt/utility/full`, `/obj/item/construction/rcd/combat/admin`,
`/obj/item/storage/part_replacer/bluespace/tier4`, `/obj/item/storage/backpack/holding`,
`/obj/item/mod/control/pre_equipped/administrative`. Or dress them in the "Debug outfit" /
"Admin outfit" with *Select Equipment* (or `m:equipOutfit(SS13.type("/datum/outfit/debug"))`).

Access:

```lua
local card = m:get_idcard()                      -- the ID they wear or hold
-- a job's access, as the HoP's console would give it
dm.global_vars.SSid_access:apply_trim_to_card(card, SS13.type("/datum/id_trim/job/chief_engineer"))
card.assignment = "Chief Engineer"   card:update_label()
-- no ID at all? give them the all-access debug card
m:put_in_hands(SS13.new("/obj/item/card/id/advanced/debug", m.loc))
```

Trims live in `code/datums/id_trim/` (`job/captain`, `centcom`, `admin`...). *Grant Full Access*
does the all-access version in one verb. Check `get_idcard`/`update_label` exist with a quick grep
on forks.

Roles and antagonists:

```lua
m.mind:add_antag_datum(SS13.type("/datum/antagonist/traitor"))
-- also: nukeop, changeling, heretic, cult, wizard, rev/head, malf_ai, obsessed, brother, ninja,
-- spy, abductor, blob, pirate, ert/security (grep "^/datum/antagonist/" for the full list)
m.mind:remove_antag_datum(SS13.type("/datum/antagonist/traitor"))
```

Machines, doors and power:

```lua
local function near(path, range)  -- things of a type around their mob
  local out = {}
  for _, a in P._range(range or 7, m) do if SS13.istype(a, path) then table.insert(out, a) end end
  return out
end
for _, d in near("/obj/machinery/door/airlock", 2) do d:unbolt(); d.welded = false; d:open(2) end
for _, mc in near("/obj/machinery", 1) do mc:repair_damage(mc.max_integrity); mc:set_machine_stat(0) end
-- power the room they are in
local area = P._get_step(m, 0).loc
local apc = area.apc
if apc then
  if apc.cell then apc.cell:give(apc.cell:max_charge()) end
  apc.operating = 1; apc:update()
  print(area.name, apc.name, apc.cell and apc.cell:charge())
else print(area.name, "has no APC") end
P.power_restore()               -- every station APC and SMES full (announced to the crew)
```

`set_machine_stat(0)` clears broken, no-power and maintenance flags; read the machine's code for
anything else it needs (a missing part, a wire cut, a `panel_open`).

Spawning crowds:

```lua
for i = 1, 5 do
  local h = SS13.new("/mob/living/carbon/human", m.loc)
  h:equipOutfit(SS13.type("/datum/outfit/job/assistant"))
end
for i = 1, 3 do SS13.new("/mob/living/basic/carp", m.loc) end
```

Looking around:

```lua
print(m.type, m.stat, m:get_brute_loss(), m:get_fire_loss(), m.loc, P._get_step(m, 0).loc)
for _, c in G.clients do print(c.ckey, c.mob.name, c.mob.x, c.mob.y, c.mob.z) end
print(dm.global_vars.SSticker.current_state)    -- round state
```

## SDQL2

```text
command  {line: "SDQL2-Query"}
tgui_act {id, action: "submit", params: {entry: "<query>"}}
tgui_act {id, action: "choose", params: {choice: "Yes"}}
read_chat {wait_s: 10, match: "completed|rror"}   # "SDQL query completed: N objects ..." or a parsing error
windows {}                                         # SELECT results open as "SDQL-result-N", with links
```

**The query box HTML-encodes what you type** (tgstation's `tgui_input_text` encodes by default),
so `"`, `'`, `<`, `>` and `&` reach the parser as entities and the query fails with "Parsing error".
Write queries without them:

- no string literals: compare against things instead (`usr`, `marked`, `{0x2000abc}` refs, numbers);
- instead of `a && b`, chain filters: `WHERE a WHERE b`; `||`, `==`, `!=`, `%` and maths are fine;
- to target one person, mark their mob first (*Mark Object*:
  `call_verb {name: "Mark Object", args: [{object_id, kind: "mob"}]}`) and use `WHERE src == marked`.

If a query needs text, do it in Lua, which takes code as typed.

Syntax (the header of `code/modules/admin/verbs/SDQL2/SDQL_2.dm` is the manual):

- `SELECT <type> [IN <list>] [WHERE <expr>] [MAP <expr>]`
- `CALL <proc(args)> ON <selector>`: a proc of the selected object itself (`a.b()` chains don't parse)
- `UPDATE <selector> SET var = value, other.var = value` (`SET #null = proc()` calls and discards)
- `DELETE <selector>`
- In expressions: `src`, `usr` (your mob), `marked`, `global.` for globals, `{0x...}` refs,
  `[a, b]` lists, typepaths, numbers. Several queries: separate with `;`.

Recipes (checked against the parser):

```text
SELECT /mob WHERE client
SELECT /obj/machinery/power/apc WHERE loc.loc == usr.loc.loc
SELECT /obj/machinery/power/apc WHERE cell MAP cell
CALL revive(16777215) ON /mob/living WHERE src == marked
UPDATE /mob/living WHERE src == marked SET #null = forceMove(usr.loc)
CALL unbolt() ON /obj/machinery/door/airlock WHERE loc.loc == usr.loc.loc
CALL open(2) ON /obj/machinery/door/airlock WHERE loc.loc == usr.loc.loc
CALL repair_damage(1000) ON /obj/machinery WHERE loc == usr.loc
DELETE /mob/living/basic/carp WHERE z == usr.z
```

Run the `SELECT` form first and check the count before anything that changes or deletes.
