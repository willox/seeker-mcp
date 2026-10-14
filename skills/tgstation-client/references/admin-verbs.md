# tgstation's admin verbs

The admin verbs of a recent tgstation, by the category the stat panel shows them in, as a map of
what exists. Forks add, rename and remove verbs: `verbs {filter: "..."}` shows what this server
has (with the exact name to type), and in the source every one is declared with an `ADMIN_VERB...`
macro, so `grep -rn 'ADMIN_VERB.*"Verb Name"' code/` finds its code, its permission and the
arguments it asks for (`VERB_ARG` lines under it).

How they ask for arguments:

- The verb itself takes nothing on the command line. Each `VERB_ARG` becomes a tgui window: a list
  (`submit {entry}`), a text or number box (`submit {entry}`), or a yes/no (`choose {choice}`).
  The verb's answer shows each window and how to answer it.
- "(on a `/mob`)" marks a right-click verb: it takes the thing as its argument,
  `call_verb {name, args: [{object_id, kind}]}`, or the verb alone to get a list to pick from.
- Many open panels instead: tgui windows (`tgui_window`, `tgui_act`) or HTML windows
  (`windows {name}`, `topic {href}`).

The most useful ones are in [admin-cookbook.md](admin-cookbook.md).

## Admin.Game

- **AGhost**: Become a ghost without DNR.
- **Change View Range**: Switch between 1x and custom views.
- **Check AI Laws**: View the current AI laws.
- **Check Antagonists**: See all antagonists for the round.
- **DSay**: Speak to the dead.
- **Dynamic Panel**: Mess with dynamic.
- **Fix Air** (on a `/turf/open`): Fixes air in a specified radius.
- **Game Panel**: Look at the state of the game.
- **Get Key**: Teleport the player with the provided key to you.
- **Get Mob** (on a `/mob`): Teleport a mob to your location.
- **Give Direct Control**: Give direct control of a mob to another player.
- **Investigate**: Browse various detailed logs.
- **Invisimin**: Toggles ghost-like invisibility.
- **Jump To Area**: Jumps to the specified area.
- **Jump To Coordinate**: Jump to a specific coordinate in the game world.
- **Jump To Ghost**: Jump your body to your Aghost.
- **Jump To Key**: Jump to a specific player.
- **List Bombers**: Look at all bombs and their likely culprit.
- **List Signalers**: View all signalers.
- **Manage Job Slots**: Manage the number of available job slots.
- **Manage Religious Sect**: Manages the chaplain's religion.
- **Player Panel**: See all players and their Player Panel.
- **Requests Manager**: Open the request manager panel to view all requests during this round
- **Respawn Character**: Respawn a player that has been round removed in some manner. They must be a ghost.
- **Secrets**: Abuse harder than you ever have before with this handy dandy semi-misc stuff menu.
- **Send Mob** (on a `/mob`): Teleport the specified mob to an area of your choosing.
- **Show Lag Switches**: Display the controls for drastic lag mitigation.
- **Show Skill Panel**: Edit mobs's experience and skill levels
- **Show Traitor Panel**: Edit mobs's memory and role
- **Spawn Panel**: Spawn Panel (TGUI).
- **Toggle Admin AI Interact**: Allows you to interact with most machines as an AI would as a ghost.
- **Toggle Admin ESP**: Toggle to be able to see ghosts and invisimins.
- **Toggle Combo HUD**: Toggles the Admin Combo HUD.
- **View All Circuits**: List all circuits in the game.
- **View Tags**: Display all of the tagged datums.

## Admin

- **ASay**: Send a message to other admins
- **Achievements Admin Panel**: View achievements management panel.
- **Admin PM**: Show a list of clients to PM
- **Adminverbs - Hide All**: Hide most of your admin verbs.
- **Announce**: Announce your desires to the world.
- **Audit Player-made Sprites**: View sprites created by players this round.
- **Banning Panel**: Ban players here.
- **DeAdmin**: Shed your admin powers.
- **Get Current Logs**: View or retrieve logfiles for the current round.
- **Get Server Logs**: View or retrieve logfiles.
- **Known Alts Panel**: View a panel of known alts.
- **Library Management**: List and manage the Library.
- **Paintings Manager**: View and redact paintings.
- **Permissions Panel**: Edit admin permissions.
- **Player Playtime**: View player playtime.
- **Player Ticket History**: Allows you to view the ticket history of a player.
- **Policy Panel**: View all policy the server has set.
- **Reload Admins**: Reloads all admins from the database.
- **Server Poll Management**: View and manage polls.
- **Show Tip**: Sends a tip to all players.
- **Stealth Mode**: Toggle stealth.
- **Sticky Ban Panel**: List and manage sticky bans.
- **Toggle Lobby Transparency**: Toggles the lobby background between opaque and transparent.
- **Trophy Manager**: View all trophies.
- **Unbanning Panel**: Unban players here.
- **View Round Logs**: View the rounds logs.
- **Whitelist CKey**: Adds a ckey to the Whitelist file.

## Admin.Fun

- **Cinematic**: Show a cinematic to all players.
- **Create Mob Worm**: Attach a linked list of mobs to your marked mob.
- **Drop Bomb**: Cause an explosion of varying strength at your location
- **Drop DynEx Bomb**: Cause an explosion of varying strength at your location.
- **Dustself**: Give yourself the same treatment you give others.
- **Gibself**: Give yourself the same treatment you give others.
- **Load Circuit**: Loads a circuit from a file or direct input.
- **Make Everyone Random**: Make everyone have a random appearance.
- **Make pAI**: Specify a location to spawn a pAI device, then specify a key to play that pAI
- **Mass Modify Traits**: Adds or removes a trait from every mob.
- **Mass Zombie Cure**: Removes the zombie infection from all humans, returning them to normal.
- **Mass Zombie Infection**: Infects all humans with a latent organ that will zombify them on death.
- **Play Direct Mob Sound**: Play a sound directly to a mob.
- **Play Global Sound**: Play a sound to all connected players.
- **Play Internet Sound**: Play a given internet sound to all players.
- **Play Local Sound**: Plays a sound only you can hear.
- **Polymorph All**: Applies the effects of the bolt of change to every single mob.
- **Possess Obj** (on a `/obj`): Possess an object.
- **Release Object**: Stop possessing an object.
- **Set Round End Sound**: Set the sound that plays on round end.
- **Smite** (on a `/mob/living`): Smite a player with divine power.
- **Summon ERT**: Summons an emergency response team.

## Admin.Events

- **Access Newscaster Network**: Allows you to view, add, and edit news feeds.
- **Add Custom AI Law**: Add a custom law to the Silicons.
- **Admin Verb Panel**: Browse and invoke admin verbs.
- **Change Command Name**: Change the name of Central Command.
- **Command Report Content**: Sets the main content of the roundstart command report.
- **Command Report Footnote**: Adds a footnote to the roundstart command report.
- **Config/Launch Supplypod**: Configure and launch a CentCom supplypod full of whatever your heart desires!
- **Create Black Market Item**: Add an item to the black market for purchase.
- **Create Command Report**: Create a command report to be sent to the station.
- **Delay Command Report**: Prevents the roundstart command report from being sent; or forces it to send it delayed.
- **Fax Panel**: View and respond to faxes sent to CC.
- **Ghost Pool Protection**: Choose which ways people can get into the round, or just clear it out completely for admin events.
- **Global Narrate**: Send a direct narration to all connected players.
- **Law Panel**: View the AI laws.
- **Load Away Mission**: Load a specific away mission for the station.
- **Load/Jump Lazy Template**: Loads a lazy template and/or jumps to it.
- **Modify Station Traits**: Modify the station traits for the next round.
- **PDA Message**: Send a message to a user's PDA.
- **RETA Door Access**: Manually trigger RETA access for testing
- **Run Weather**: Triggers specific weather on the z-level you choose.
- **Set Security Level**: Changes the security level. Announcement effects only.
- **Spawn Reagent Container**: Spawn a reagent container.
- **Stop All Active Weather**: Stop all currently active weather.
- **Toggle Build Mode Self**: Toggle build mode for yourself.
- **Toggle Nuke**: Arm or disarm a nuke.
- **Trigger Event**: Forces an event to occur.

## Debug

- **Advanced ProcCall**: Call a proc on any datum in the server.
- **Adventure Manager**: View and edit adventures.
- **Air Status In Location**: Gets the air status for your current turf.
- **Allow Browser Inspect**: Allow browser debugging via inspect
- **Assume Direct Control**: Assume direct control of a mob.
- **Atmos Control Panel**: Open the atmospherics control panel.
- **Check Bomb Impact**: See what the effect of a bomb would be.
- **Check Timer Sources**: Checks the sources of running timers.
- **Clear Dynamic Turf Reservations**: Deallocates all reserved space, restoring it to round start conditions.
- **Clear Legacy Asset Cache**: Clears the legacy asset cache, regenerating it immediately (may cause lag).
- **Clear Smart Asset Cache**: Clear the smart asset cache, causing it to regenerate next round.
- **Color Powernet Runs**: Colors every node and cable of every powernet in a different color.
- **Colorblind Testing**: Change your view to a budget version of colorblindness to test for usability.
- **Controller Overview**: View the current states of the Subsystem Controllers.
- **Count Atoms/Datums**: Count how many atom or datum instances there are of each type, then output it to a JSON to download.
- **Create Or Modify Area**: Create of modify an area. wow.
- **Debug Controller**: Debug the various periodic loop controllers for the game (be careful!)
- **Debug HUDs**: Debug the data or antag HUDs.
- **Debug MC Dependencies**: Debug MC dependencies.
- **Debug Mob Lists**: For when you just gotta know.
- **Debug Spell Requirements**: View all spells and their requirements.
- **Debug Stat Panel**: Toggles local debug of the stat panel
- **Debug Worn Item Sprites**: We're cancelling the Spritemageddon. (This will create a LOT of runtimes! Don't use on a live server!)
- **Debug-Game**: Toggles game debugging.
- **Del-All**: Delete all datums with the specified type.
- **Display Initialize() Log**: Displays a list of things that didn't handle Initialize() properly.
- **Display Overlay Log**: Display SSoverlays log of everything that's passed through it.
- **Display del() Log**: Display del's log of everything that's passed through it.
- **Dynamic Tester**: See dynamic probabilities.
- **Edit/Debug Planes**: Edit and visualize plane masters and their connections (relays).
- **Enable/Disable Field Of View**: Toggle FOV globally.
- **Fishing Calculator**: A calculator... for fishes?
- **Fix Next Move**: Unfreezes all frozen mobs.
- **Force-Del-All**: Forcibly delete all datums with the specified type.
- **Generate Pipe Spritesheet**: Generates the pipe spritesheets.
- **Get DynEx Power**: Get the estimated required power of a bomb to reach the given range.
- **Get DynEx Range**: Get the estimated range of a bomb using explosive power.
- **Grant Full Access**: Grant full access to a mob.
- **Hard-Del-All**: Hard delete all datums with the specified type.
- **Jump to Ruin**: Displays a list of all placed ruins to teleport to.
- **List DNA**: View DNA.
- **List Fingerprints**: View fingerprints.
- **List Law Changes**: View all AI law changes.
- **Make Powernets**: Regenerates all powernets for all cables.
- **Manipulate Organs**: Manipulate the organs of a living carbon.
- **Map Export**: Select a part of the map by coordinates and download it.
- **Map Template - Place**: Place a map template at your current location.
- **Map Template - Upload**: Upload a map template to the server.
- **Modify Goals**: Modify the station goals for the shift.
- **Open Event Logger**: Open the event logger interface.
- **Open Lua Editor**: Its codin' time.
- **Outfit Manager**: View and edit outfits.
- **Parse Wikichems**: Parse and generate a text file for wikichem.
- **PodSpawn**: Spawn an atom via supply drop.
- **Populate World**: Populate the world with test mobs.
- **Print Cards**: Print all cards to chat.
- **Pump Random Event**: Schedules the event subsystem to fire a new random event immediately. Some events may fire without notification.
- **Radio Report**: Shows a report of all radio devices and their filters.
- **Re-establish Connection To TTS**: Re-establishes connection to the TTS server if possible
- **Reload Cards**: Reload all TCG cards.
- **Reload Configuration**: Reloads the configuration from the default path on the disk, wiping any in-round modifications.
- **Reset Tram**: Reset a tram controller or its contents.
- **Restart Controller**: Restart one of the various periodic loop controllers for the game (be careful!)
- **Run Empty Query**: Runs a specified number of empty queries.
- **Run Tracy Now**: Start running the tracy profiler immediately
- **SDQL2 Query**: Run a SDQL2 query.
- **Send Maps Profile**: View the profile.
- **Set DynEx Scale**: Set the scale multiplier on dynex explosions. Default 0.5.
- **Set Server FPS**: Sets game speed in frames-per-second. Can potentially break the game
- **Show Hallucination Weights**: View the weight of each hallucination subtype in the random weighted list.
- **Show Manifest**: View the shift's Manifest.
- **Spawn**: Spawn an atom.
- **Spawn Cargo**: Spawn a cargo crate.
- **Spawn Debug Full Crew**: Creates a full crew for the station, flling datacore and assigning minds and jobs.
- **Spawn Movable UI Object**: Spawn a movable UI object for testing.
- **Spawn Object-Mob**: Spawn an object as if it were a mob.
- **Spawn Snap UI Object**: Spawn a snap UI object for testing.
- **Stop All Playing Sounds**: Stops all playing sounds for EVERYONE.
- **Test Cardpack Distribution**: Test the distribution of a card pack.
- **Test Nature Map Generator**: Test the nature map generator
- **Toggle Camera Updates**: Stop security cameras from updating, meaning what they see now is what they will see forever.
- **Toggle Medal Disable**: Toggles the safety lock on trying to contact the medal hub.
- **Toggle Pathfind Testing**: Enables/Disables pathfinding testing action buttons
- **Toggle Tracy Next Round**: Toggle running the tracy profiler next round
- **Unload CTF**: Despawns the majority of CTF.
- **Validate Cards**: Validate the card settings.
- **Validate Puzzgrid Config**: Validate the puzzgrid config to ensure it's set up correctly.
- **View Behavior Tree**: Inspect the AI behavior tree of a mob.
- **View Runtimes**: Opens the runtime viewer.

## Server

- **Cancel Reboot**: Cancels a pending world reboot.
- **Change Map**: Set the next map.
- **Delay Pre-Game**: Delay the game start.
- **Delay Round End**: Prevent the server from restarting.
- **End Round**: Forcibly ends the round and allows the server to restart normally.
- **Export Save as Dev Preferences**: Exports your savefile to be used by any guests that connect to your localost.
- **Generate Job Configuration**
- **Jukebox Browse Music**: Browse music files for moderation.
- **Jukebox Upload Music**: Upload a valid .ogg file to be accessed via the jukebox.
- **Reboot World**: Restarts the world immediately.
- **Reestablish DB Connection**: Attempts to (re)establish the DB Connection
- **Reset Player OOC Color**: Returns player OOC color to default.
- **Revert Map Vote**: Revert the map vote, allowing a new vote.
- **Set Admin Notice**: Set an announcement that appears to everyone who joins the server. Only lasts this round.
- **Set Player OOC Color**: Modifies the global OOC color.
- **Start Now**: Start the round RIGHT NOW.
- **Toggle AI**: Toggle the ability to choose AI jobs.
- **Toggle CDN**: Toggles the CDN for the server.
- **Toggle Dead OOC**: Toggle the OOC channel for dead players on or off.
- **Toggle Dead Vote**: Toggle the vote for dead players on or off.
- **Toggle Entering**: Toggle the ability to enter the game.
- **Toggle Guests**: Toggle the ability for guests to enter the game.
- **Toggle Hub**: Toggles the server's visibility on the public server list.
- **Toggle OOC**: Toggle the OOC channel on or off.
- **Toggle PB Interviews**: Toggle whether new players will be interviewed or blocked from connecting.
- **Toggle Panic Bunker**: Toggles the panic bunker for the server.
- **Toggle Random Events**: Toggles random events on or off.
- **Toggle Respawn**: Toggle the ability to respawn.

## Admin.Shuttle

- **Call Shuttle**: Force a shuttle call with additional modifiers.
- **Cancel Shuttle**: Recall the shuttle, regardless of circumstances.
- **Change Shuttle Events**: Change the events on a shuttle.
- **Disable Shuttle**: Those fuckers aren't getting out.
- **Enable Shuttle**: Those fuckers ARE getting out.
- **Hostile Environment**: Disable the shuttle, naturally.
- **Shuttle Manipulator**: Opens the shuttle manipulator UI.

## Mapping

- **Camera Range Display**: Shows the range of cameras on the station.
- **Camera Report**: Get a printout of all camera issues.
- **Check For Obstructed Atmospherics**: Checks for obstructions on atmospherics machines.
- **Check Plumbing**: Verifies the integrity of the plumbing network.
- **Check Power**: Verifies the integrity of the power network.
- **Count Objects All**: Counts the number of objects of a certain type in the game world.
- **Count Objects On Z-Level**: Counts the number of objects of a certain type on a specific z-level.
- **Count Station Food**: Counts the number of food items on the station.
- **Count Station Stacks**: Count the stacks of materials on station.
- **Debug Z-Levels**: Displays a list of all z-levels and their linkages.
- **Dirty Varedits**: Shows all dirty varedits.
- **Disable Mapping Verbs**: Disable all mapping verbs.
- **Disable all communication verbs**: Disables all communication verbs.
- **Enable Mapping Verbs**: Enable all mapping verbs.
- **Generate job landmarks icons**: Generates job starting location landmarks.
- **Intercom Range Display**: Shows the range of intercoms on the station.
- **Show Map Reports**: Displays a list of map reports.
- **Show roundstart AT list**: Displays a list of active turfs coordinates at roundstart.
- **Show roundstart AT markers**: Places a marker on all active-at-roundstart turfs.
- **Spawn Ruin**: Attempt to randomly place a specific ruin.
- **Test Areas**: Tests the areas for various machinery.
- **Test Areas (ALL)**: Tests the areas for various machinery on all z-levels.
- **Test Areas (STATION - NO MAINT)**: Tests the areas for various machinery on station z-levels, excluding maintenance areas.
- **Test Areas (STATION ONLY)**: Tests the areas for various machinery on station z-levels.
- **Toggle Light Debug**: Toggles light debug mode.
- **Visualize Lighting Corners**: Visualizes the corners of all lights on the station.

## Profile

- **Show Line Profiling**: Shows tracked profiling info from code lines that support it.
- **Start Line Profiling**: Starts tracking line by line profiling for code lines that support it.
- **Stop Line Profiling**: Stops tracking line by line profiling for code lines that support it.

## Admin.IPIntel

- **Revoke Player VPN Whitelist**: Revoke a player's VPN whitelist.
- **Whitelist Player VPN**: Allow a player to connect even if they are using a VPN.

## (right-click menu only)

- **Admin PM Mob** (on a `/mob`)
- **Atom ProcCall** (on a `/datum`)
- **Check Contents** (on a `/mob/living`)
- **Debug Air Status**
- **Delete** (on a `/atom`)
- **Direct Narrate** (on a `/mob`)
- **Drop Everything**
- **EM Pulse**
- **Explosion**
- **Gib**
- **Give AI Controller**
- **Give Disease**
- **Give Mob Action**
- **Give Spell**
- **Headset Message** (on a `/mob`)
- **Jump To Mob** (on a `/mob`)
- **Jump To Turf** (on a `/turf`)
- **Local Narrate** (on a `/atom`)
- **Make Cyborg**
- **Mark Object** (on a `/datum`)
- **OSay** (on a `/obj`)
- **Rejuvenate** (on a `/mob/living`)
- **Remove Mob Action**
- **Remove Spell**
- **Select Equipment** (on a `/mob`)
- **Show Borg Panel**
- **Show Occupants PP** (on a `/obj`)
- **Show Player Panel** (on a `/mob`)
- **Subtle Message** (on a `/mob`)
- **Tag Datum** (on a `/datum`)
- **Tweak Component Ratings** (on a `/obj/machinery`)
- **UnPrison**
- **View Variables** (on a `/datum`)
