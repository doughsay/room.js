# Organizing and customizing your world objects

This guide is intended for administrators and game builders, when setting up the initial instance for their own game based on the Room.JS MUD/MOO engine.

## Introduction
We will deal here with both the object identifiers and the underlying on-disk file hierarchy, as there is a one-to-one mapping between them -- For details, refer to the [Programming guide](PROGRAMMING.md):

> Identifiers are internally mapped to a file path by the DB (e.g. "lib.room" will be mapped
> to "lib/room"). This allows organizing the objects logically -- You can create objects at
> any level, but it is a **good practice** to enquire your game administrator regarding the
> recommended naming scheme.

World objects can be created at any logical level. In this document, the demonstration world is used as a sample -- your own world may end up with a different structure.

The term "mudlib" hereafter refers to the very basic set of objects and entities that are initally required to make the first real objects in your game (i.e. the base structure for rooms, containers, behaviors, etc.). The demonstration comes with its own mudlib, which you can modify/extend, but it is wholly replaceable -- By nature, the demonstration mudlib has been kept small (no character classes or combat system, for instance -- You'll have to design your owns).

## Core objects (mandatory)
The following objects shall always be present, as they are internally used by the game engine.

| Object     | Comment |
| ---------- | ------- |
| system     | See further below. |
| fail       | An object returned by search functions, when no matching object could be found. |
| ambiguous  | An object used by search functions, when several matches are possible. |
| nothing    | Another object used by search functions, when no object is specified. |

## Customizable hooks (adaptable)

The **system** object is where several customizable hooks are defined (besides a few other utility functions, which are not described in this document).

| Customizable hook    | comment |
| -------------------- | ------- |
| onServerStarted | Invoked when the server just started -- The demonstration does nothing here, but that's where you can implement any (re)initialization logic. |
| onPlayerCreated | Invoked when a new player character is created: this is where you can define his/her initial location and the appropriate trait(s) for the player object. (It comes with none by default, so you have do define it -- The demonstration uses **lib.player** from its mudlib.) |
| onPlayerConnected | Invoked when a player character enters the world: this is where you can restore his/her previous location, and possibly announce his/her arrival to other players (at least in the room, if not to all) -- The demonstration relies on the doEnter() method, from the mudlib **lib.room** object, and obviously refers to a demonstration-specific initial location. |
| onPlayerDisconnected | Invoked when a player character quits the world: this is where you can reset his/her location, and possibly announce his/her leaving to other players (at least in the room, if not to all). |
| onPlayerCommandFailed | Invoked when a player command could not be matched: this is where you can possibly interpret the failure reason, allowing for more precise messages and game-specific decisions, suggesting help, etc. |
| preprocessCommand | Invoked before any command processing takes placed: this is where the mode system is usually applied, therefore its implementation relies on the player and mode objects. |

Additionaly, a few other hooks are invoked by the game engine:

| Customizable hook    | comment |
| -------------------- | ------- |
| onTabKeyPress | Invoked on the player object when the TAB key event is received. In the demonstration, this is used to cycle through the different modes (a.k.a. PLAY, CHAT, SAY, EVAL), and implemented in the **lib.player** object. |
| onLocationChanged | If present on an object, invoked whenever its location changes. |
| verbMissing | If present on a location object (room), invoked when a player command could not be matched. In that case, the system.onPlayerCommandFailed() hook is not invoked, but the command is delegated to the room for in-game interpretation. |

## Useful objects (recommended)
The following objects are not mandatory *per se* but are probably best keeping (and customized, if need really be).

| Object     | Comment |
| ---------- | ------- |
| help       | The in-game help system: may be used as a basis for designing your own. |
| modes      | (Several mode objects located in sub-directories.) The mode system (a.k.a. PLAY, CHAT, SAY, EVAL): may be modified according to your needs. |
| util       | Several useful functions (e.g. for normalizing directions, capitalizing strings, etc.): may be extended, obviously. |
| views      | Some other useful methods (e.g. generic helpers for announcement formatting). |

## Mudlib objects (replaceable)

In the demonstration, all mudlib objects are located under the *lib/* directory (and henceforth, their identifiers all start with "lib.").

The mudlib defines an initial class hierarchy for designing more complex objects, for details see the [Demonstration mudlib](DEMO_MUDLIB.md) memorandum.

You may replace it by your own.

## Player objects (removable, if any)

Player objects (i.e. characters) are normally all located under the *players/* directory.
The demonstration should not come with any, since you will just create them when playing :)

For the record, player accounts (i.e. login credentials etc.) are stored in another DB (defined via environment variables and/or in the `.env` file).

## All other objects (removable)

All other objects are demonstration-specific, so you may wholly remove them when creating your own game. As noted, you may follow any convention and logical naming scheme for your world, but you will likely want to manage the objects in a maintenable way. 

For instance, the demonstration adopts the following scheme:
- All useable items are located in *items/* (and therefore have identifiers starting with "items."),
- Rooms are structured under *areas/* (and therefore have identifiers such as "areas.something.roomname").
- Cloned objects (i.e. copies of useable items, such as made by the seller NPCs) are located in *instances/*.

Once you have created a room of your own, and changed the system.onPlayerConnected() hook
to use that room as initial location, you may remove the aforementioned directories/objects.
