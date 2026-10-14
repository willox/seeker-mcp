# Playing goonstation

The seeker tools see what a player sees and act as a player does. Their answers already carry
game hints (dangers, what a click did, what a window wants); this page is the background.

## The round

- **Lobby**: `lobby {action: "join", job: "..."}` late-joins with a job (the latejoin menu lists
  them), `ready` before the round starts, `observe` makes you a ghost. Some modes (extended,
  secret) never start a round without enough ready players; an admin can *Start Now*.
- A round ends when the escape shuttle leaves or a mode's goal is met; the server restarts and you
  reconnect.
- The stat panel shows the round time, the map and the mode.

## Your body

- **Intents** decide what a click on a person does: help (1), disarm (2), grab (3), harm (4). The
  HUD shows the current one; `key {key: "4"}` picks harm. Keys 5-0 target body parts.
- Two hands: `click` with the active one; `E` swaps hands, `C` uses the held item on itself, `Q`
  drops it, `V` equips it, `Delete` toggles throwing (then click where), `Z` resists, `P` picks up.
  `key` with no arguments lists the bindings this server gives you.
- `inventory` lists what you hold and wear; `screen` lists the HUD (intents, internals, pulling);
  health problems show as alerts on the screen.
- Goonstation has its own medical model: brute, burn, toxin, oxygen damage plus bleeding, organs
  and bones. Health analyzers and the medbay sort it out.
- Movement: `walk_to` plans a route (it knows doors and their access once a station map is loaded
  with `load_map`), `move` steps, `explore` finds what you haven't seen.

## The station

- **Doors** need access on your ID (in the ID slot or held). Bolted doors don't move; unpowered
  ones open with a crowbar. Maintenance tunnels connect everything.
- **Power**: each room has an APC; machines stop when its equipment channel is off or its cell is
  empty. The engine (a singularity, a thermo-electric generator or solars, by map) feeds the grid
  through SMES units.
- **Atmosphere**: space and fires kill; firelocks close off bad air. Internals and a sealed suit
  keep you breathing.
- **Jobs**: command (captain, heads), security, engineering, medical (and genetics), research,
  cargo (quartermasters, mining), civilian (chef, bartender, botanist, janitor, clown, staff
  assistants...). Many goonstation machines are tgui windows: `tgui_window` reads them,
  `tgui_act` presses their buttons.

## Talking

- `say {text}` speaks to people near you. Radio: `;` is the general channel, `:` and a key a
  headset's other channels (examine the headset for its keys). `:in` speaks into an intercom,
  `:lh` / `:rh` into the radio in that hand.
- `say {channel: "ooc"}` (server-wide), `looc` (local out of character), `me` emotes, `whisper`.
- `read_chat` and `wait {from_others: true}` catch what others say.

## Antagonists and danger

- Traitors, changelings, vampires, wizards, nuclear operatives, werewolves, arcfiends, flocks,
  blobs, wraiths and more, depending on the mode. Antagonists get objectives in chat (the notes
  verb repeats them) and their tools (a traitor's uplink sits in their PDA or headset).
- Answers start with `danger` when something threatens you; act on it first.

## As a ghost

- Ghosts fly through everything. Ghost verbs: *Teleport* (to an area), *Observe* (follow
  someone), *Re-enter Corpse*, *Toggle Ghosts*, *Toggle Lighting*. Admins can also *Respawn Self*
  or *Respawn As Job* to come back at once.
