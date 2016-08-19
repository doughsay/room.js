# A brief description of the demonstration mudlib

The RoomJS game engine does not make many assumptions about the gaming logic. It can be regarded as a generic "driver" responsible for handling connections and player accounts,  dispatching commands and providing a persisent world -- But basically, everything else is entirely up to the game developers.

As noted in the [Customization guide](CUSTOMIZING.md), which the reader is assumed to have first read at this point:

> The term "mudlib" refers to the very basic set of objects and entities that are initally required to make the first real objects in your game, i.e. the base structure for rooms, containers, behaviors, etc.). The demonstration comes with its own mudlib, which you can modify/extend, but it is wholly replaceable -- By nature, the demonstration mudlib has been kept small (no character classes or combat system, for instance -- You'll have to design your owns).

This memorandum describes the demonstration mudlib (i.e. *lib\_xxx* objects), which may be used as a sample for designing and implementing you own game logic.

## Introduction

For each objects, this memorandum provides:
- The directly inherited traits,
- Verbs defined by the object,
- Functions defined by the object,
- Properties defined by the object,
- If any, triggers provided by this object: these are callback functions that do nothing by default, but are intended for being overloaded by derived classes.

### Pure traits

These objects are purely 'abstract' (i.e. they don't inherit from **lib\_root**), and are
intended to be added to objects deriving from it, to extend their functionality).

#### lib\_traits\_describable

A trait for items than can be described.

Traits: none

Verbs:

| Verb                        | 
| --------------------------- | 
| l\*ook/ex\*amine this       | 

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| describe                    | Returns the object description if defined, or the object name. May be overloaded by derived objects. |

Properties: 

| Property                    | Description   |
| --------------------------- | ------------- |
| description : String        | Optional textual description for the object |

#### lib\_traits\_gettable

A trait for items that can be taken or dropped.

Traits: none

Verbs:

| Verb                        | 
| --------------------------- | 
| get/take this               | 
| drop this                   | 

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| announceTakeItem            | Defines the message displayed in the room when the object is taken |
| announceDropItem            | Defines the message displayed in the room when the object is dropped |

Properties: none

Triggers: none, but that's probably missing (e.g. onDropItem/onTakeItem)

#### lib\_traits\_closeable

A trait for items that can be opened/closed/locked/unlocked.

Traits: none

Verbs:

| Verb                         | 
| ---------------------------- | 
| open this                    | 
| close this                   | 
| unlock/open this with/using any |
| lock/close this with/using any |

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| doOpen                      | Opening logic |
| doClose                     | Closing logic |
| doLock                      | Locking logic |
| doUnlock                    | Unlocking logic |
| addKeyId                    | Convenience function for adding a key identifier to the object |
| rmKeyId                     | Convenience function for removing a key identifier to the object |

Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| locked   : Boolean          | True if item is locked. Defaults to true |
| closed   : Boolean          | True if item is closed. Defaults to true |
| keySet   : Array.String     | Key identifiers (see **lib\_key** below) for locking/unlocking the object. Default to [ "masterkey" ] |
| autolocking : Boolean       | Optional flag. If true, the object will lock itself when being closed |

- If you don't want the object to be lockable/unlockable, set the keySet to an empty array,
- The "masterkey" identifier stands for an all-purpose master key, so you may either remove it or rather just add specific key identifiers.

Triggers:

| Trigger                     | Description   |
| --------------------------- | ------------- |
| onOpen                      | Fired after object is opened |
| onClose                     | Fired after object is closed |
| onLock                      | Fired after object is locked |
| onUnlock                    | Fired after object is unlocked |

#### lib\_traits\_container

A trait for items that can serve as containers.

Traits: none

Verbs:

| Verb                        | 
| --------------------------- | 
| get/take any out of/from/inside/from this | 
| put any in/inside/into this | 
| l\*ook in/inside/into this  |

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| announcePutItemContainer    | Defines the message displayed in the room when an object is put into the container |
| announceTakeItemContainer   | Defines the message displayed in the room when the object is dropped |
| canAccept                   | Checks the container interior can be accessed. Currently only checks whether the container is closed, in case it also inherits from *lib\_traits\_closeable* |
| describeContents            | Returns the contents of the container |

Properties: none

Triggers: none, but that's probably missing (or we should use onDropItem/onTakeItem if the instances has *lib\_traits\_gettable*)

#### lib\_traits\_edible

A trait for items that can be eaten or drunk.

Traits: none

Verbs:

| Verb                         | 
| ---------------------------- | 
| eat/drink <this>             | 

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| doUse                       | Drinking/eating logic     |
| canUse                      | Check if eating/drinking is possible. Returns true, but intended to be overloaded by derived objects, e.g. see **lib\_ediblecontainer** |

Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| DRINK = 1, MEAL = 2         | Bit mask constants for type of food |
| foodType : Integer          | Current type (1) |
| destroyOnUse : Boolean      | True if the object should be destroyed after use. Defaults to false |

- To keep this as simple as possible, edibled object are either single use (when destroyOnUse is true) or inexhaustible (when false).
- See also **lib\_ediblecontainer** below, which is not destroyed when used, but handles its own exhaustion state.

Triggers:

| Trigger                     | Description   |
| --------------------------- | ------------- |
| onUse                       | Fired after object is eaten or drunk |

#### lib\_traits\_commandable

A trait for locations (as opposed to the previous ones), using the special "verbMissing" property on locations, invoked by the game engine when a matching verb cannot be found according to the usual command processing rules. 

Rooms with this trait will try to delegate the unrecognized command to the first item in their contents that can possibly accepts the command.

The idea here is that the location does know which commands exit, but some item in it would perhaps. Typically, it may be used for shops, where there might be a seller/trader in the room to accept the command.

Traits: none

Verbs: none

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| verbMisssing                | Special property on locations, invoked when the game engine failed at finding an appropriate verb |
| delegateCommand             | Browse the location's constant for an item that would accept the command |

Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| allowedCommands : Array.String | Commands that be delegate (["list", "sell", "buy", "order"]) |

- It comes with a set of predefined commands suitable for shops.

### Root object

#### lib\_root

A base parent trait for all other objects.

Traits: none

Verbs: none

Functions:

| Function                  | Description   |
| ------------------------- | ------------- |
| tell(msg : String)        | If the object is a player, sends a message to him/her |
| clone(id : String)        | Convenience function to create a new object, also copying the name, description and aliases from its parent (i.e. all things that the regular **new()** doesn't do). | 

### Rooms and doors

#### lib\_room

The base structure for rooms.

Traits: **lib\_root**

Verbs:

| Verb                         | 
| ---------------------------- | 
| l\*ook                       |
| g\*o any                     |   
| n\*orth e\*ast s\*outh w\*est u\*p d\*own ne se nw sw northeast northwest southeast southwest |

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| doEnter                     | Entering logic |
| doLeave                     | Leaving logic  |
| canEnter                    | Checks if the room may be entered. Returns true, so intended to be overloaded by derived objects |
| canLeave                    | Checks if the room may be left. Returns true, so intended to be overloaded by derived objects |
| announceEnterRoom           | Defines the message displayed in the room upon entering |
| announceLeaveRoom           | Defines the message displayed in the room upon leaving  |
| describe                    | Returns the room description |
| announce                    | Announcement broadcasting logic, to all players in the room |
| addExit(String, WorldObject) | Convenience function for adding an exit in the given direction |

Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| exits : Object              | Object whose keys are the directions, and values are the target location |
| description : String        | Textual long description for the room ("An undescript room.") |

Triggers:

| Triggers                    | Description   |
| --------------------------- | ------------- |
| onEnter                     | Fired after the room is entered |
| onLeave                     | Fired when the room is being left |

#### lib\_door

A door is a two-way traversable entity.

For the reminder, once you have connected rooms via a door, you will very likely want to add the door to the extraMatchObjects property of each room, so that players can operate upon the door (since it is not an item in the room's content).

Traits: **lib\_root**, **lib\_traits\_describable**, **lib\_traits\_closeable**

Verbs: none

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| doEnter                     | Entering logic, i.e. immediate traversal from one side to the other |
| canEnter                    | Checks if the door may be traversed, e.g. it's not closed and the two sides are defined |
| describe                    | Overloads the default description |
| announce                    | Announcement broadcasting logic, to operate on both sides |
| addExit(WorldObject)        | Convenience function for adding a side, unless there are already two |

Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| sides : Array[2]            | Up to two connected rooms |
| description : String        | Textual long description for the door ("A standard door.") |

Triggers:

| Triggers                    | Description   |
| --------------------------- | ------------- |
| onTraversal                 | Fired when the door is traversed.  |

- Technically, the player is still in the initial room when the trigger is fired.
- Example use: announce something to both sides of the door, when it is traversed

```
function onTraversal(player) {
  this.announce((sender, recipient) => {
    return "You hear a distant bell ring.";
  }, player)
}
```

### Items

#### lib\_item

The base structure for items.

Traits: **lib\_root**, **lib\_traits\_describable**, **lib\_traits\_gettable**

Verbs: none

Functions: none

Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| description : String        | Default textual description ("An undescript item.") |

#### lib\_key

A base object for designing key-like items, allowing to lock/unlock closeable objects.

Traits: **lib\_item**

Verbs: none

Functions: none

Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| description : String        | Default textual description ("An undescript key.") |
| keyId : String              | Default key identifier for matching closeable objects ("masterkey") |

- The key identifier is set to "masterkey", which is also the initial setting for **lib\_traits\_closeable**, so any derived object will by default be an all-purpose master key. It is up to you to change it, following you own identification pattern.
 
#### lib\_ediblecontainer

A base object for designing single use items containing edible things, such as a cup of tea, a plate of potatoes, etc. When used, they'd become an empty cup, an empty plate, etc.

Traits: **lib\_item**, **lib\_traits\_edible**

Verbs: none

Functions: 

| Property                    | Description   |
| --------------------------- | ------------- |
| doUse                       | Set the exhausted flag, and resets aliases accordingly |
| canUse                      | Returns false if exhausted, true otherwise          |
| describe                    | Constructs a description from the object's own description, whether it's empty or not, and in the latter case the description of the content |
| setEdible                   | Convenience function for setting the name and description of the content, and resets all flags and aliases accordingly, i.e. refills the item |

Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| exhausted : String          | True when empty |
| containerObject : String    | Default container name ("bottle.") |
| containedEdible : String    | Default content name ("water") |
| edibleDescription : String  | Optional description for the content |

### Living things

#### lib\_player

The base structure for players.

Traits: **lib\_root**, **lib\_traits\_describable**

Verbs:

| Verb                         | 
| ---------------------------- |
| i*nventory                   | 
| say any                      |
| ch\*at any                   |   
| who                          |
| help any                     |

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| announceSay                 | Defines the message displayed in the room when the "say" command is used |
| setMode                     | Sets the mode |
| nextMode                    | Gets the next mode according to a direction (i.e. whether TAB was initially shifter or not) |
| renderPrompt                | Builds the appropriate prompt for the current mode, and invokes setPrompt() |
| onTabKeyPress               | Hook invoked by the game engine when the TAB key event is recieved. Just calls the above mode-changing methods |


Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| mode : WorldObject          | Current mode (play, say, chat, eval) |

#### lib\_npc

The base structure for non-player characters. This is just a demo, so we don't
really know what NPCs are - but we'd probably like them to have extra features in the
future.

Traits: **lib\_root**, **lib\_traits\_describable**

Verbs: none

Functions: none

Properties: none

#### lib\_npc\_seller

The base structure for (very simple) NPC sellers. The 'list' command allows getting the list of goods, and the 'order' command to obtain one of the listed goods.

The goods available for sale are those in the object's contents (so logically you would want to have different types of items there). Upon order, the required object is cloned and the newly created instance is given to the player (i.e. placed in the player's contents).

For this to work, the NPC must be in a room that has the **lib\_traits\_commandable** trait, for the player commands to be delegated to the NPC.

Traits: **lib\_npc**

Verbs:

| Verb                         | 
| ---------------------------- |
| list                         | 
| order/buy any                | 

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| announceSale                | Defines the message displayed in the room when the sale is concluded with a player |
| announceOffer               | Defines the message displayed in the room when the seller acts on himself (e.g. is a player, see below) |

- For more advanced trader NPCs, one idea would be to use another location that the object's contents, such as a dedicated room (logically not accessible to regular players).
- For the record, if a player is being given this trait, the cloned good is dropped in the location, rather than placed in the player's contents. The commands will work for the player himself in any location, and will work for other players when in a commandable room. This might sound a bit weird to add this trait to a player, but during demo-building, I found this little trick useful to clone objects from my inventory here and there without having to do any programming.

Properties: none
