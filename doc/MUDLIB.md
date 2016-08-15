# Description of the demo mudlib

This memorandum describes the demo mudlib (i.e. *lib\_xxx* objects), which may be used as
a sample for designing you own world.

THIS IS A WORK IN PROGRESS

## Introduction

Lorem ipsum dolor sic amet...

### Pure traits

These objects are purely 'abstract' (i.e. they don't inherit from **lib\_root**), and are
intended to be added to objects deriving from it, to extend their functionality).

##### lib\_traits\_describable

A trait for items than can be described

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

Triggers: none

##### lib\_traits\_gettable

A trait for items that can be taken or dropped.

Traits: none

Verbs:

| Verb                        | 
| --------------------------- | 
| get/take this               | 
| drop this                   | 
| keep this                   |

- Items marked for keeping cannot be dropped inadvertently.

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| announceTakeItem            | Defines the message displayed in the room when the object is taken |
| announceDropItem            | Defines the message displayed in the room when the object is dropped |

Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| keepFlag : Boolean          | Optional flag marking the object as kept, when true. |

Triggers: none, but that's probably missing (e.g. onDropItem/onTakeItem)

##### lib\_traits\_closeable

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
| doOpen                      |               |
| doClose                     |               |
| doLock                      |               |
| doUnlock                    |               |
| addKeyId                    |               |
| rmKeyId                     |               |

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

##### lib\_traits\_container

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

##### lib\_traits\_edible

A trait for items that can be eaten or drunk.

Traits: none

Verbs:

| Verb                         | 
| ---------------------------- | 
| eat/drink <this>             | 

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| doUse                       |               |
| canUse                      |               |

Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| DRINK = 1, MEAL = 2         | Bit mask constants for type of food |
| foodType : Integer          | Current type (1) |
| destroyOnUse : Boolean      | True if the object should be destroyed after use. Defaults to false |

- To keep this as simple as possible, edibled object are either single use (when destroyOnUse is true) or inexhaustible (when false).
- Basically, the idea is that meal is usually for single use, and drink is inexhaustible, but the **lib\_liquidcontainer** is probably what you'll rather use for single use drinks.

Triggers:

| Trigger                     | Description   |
| --------------------------- | ------------- |
| onUse                       | Fired after object is eaten or drunk |

##### lib\_traits\_commandable

A trait for locations (as opposed to the previous ones), using the special "verbMissing" on locations, invoked by the game engine when no matching verb has been found according to the usual rules. It the tries to delegate the command to the first item in the location that possibly accepts the command.

The idea here is that the location does know which command exits, but some item would.
Typically, it is used for shops, where there might be a trader in the room to accept the command.

Traits: none

Verbs: none

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| verbMisssing                | Special property on locations, invoked when the game engine failed at find an appropriate verb |
| delegateCommand             | Browse the location's constant for an item that would accept the command |

Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| allowedCommands : Array.String  | Commands that be delegate (["list", "sell", "buy", "order"]) |

- It comes with a set of predefined commands suitable for shops.

Triggers: none

### Root object

##### lib\_root

A base parent trait for all other objects.

Traits: none

Verbs: none

Functions:

| Function                  | Description   |
| ------------------------- | ------------- |
| tell( msg : String )      | If the object is a player, sends a message to him/her |
| clone( id : String )      | Convenience function to create an object but also copy its name description and aliases from its parent. | 

Triggers: none

### Rooms and doors

##### lib\_room

The base structure for rooms.

Traits: **lib\_root**

Verbs:

| Verb                         | 
| ---------------------------- | 
| l\*ook                       |
| g\*o <any>                   |   
| n\*orth e\*ast s\*outh w\*est u\*p d\*own ne se nw sw northeast northwest southeast southwest |

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| doEnter                     |               |
| doLeave                     |               |
| canEnter                    |               |
| canLeave                    |               |
| announceEnterRoom           |               |
| announceLeaveRoom           |               |
| describe                    |               |
| announce                    |               |
| addExit                     |               |

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

##### lib\_door

A door is a two-way traversable entity.

Traits: **lib\_root**, **lib\_describable**, **lib\_closeable**

Verbs: none

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| doEnter                     |               |
| canEnter                    |               |
| describe                    |               |
| announce                    |               |
| addExit                     |               |

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

##### lib\_item

The base structure for items.

Traits: **lib\_root**, **lib\_describable**, **lib\_gettable**

Verbs: none

Functions: none

Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| description : String        | Default textual description ("An undescript item.") |

Triggers: none

##### lib\_key

A base object for designing key-like items, allowing to lock/unlock closeable objects.

Traits: **lib\_item**

Verbs: none

Functions: none

Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| description : String        | Default textual description ("An undescript key.") |
| keyId : String              | Default key identifier for matching closeable objects ("masterkey") |

- The key identifier is set to "masterkey", which is also the initial setting for **lib\_closeable**, so any derived object will by default be an all-purpose master key. It is up to you to change it, following you own identification pattern.

Triggers: none
    
##### lib\_ediblecontainer

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

Triggers: none

### Living things

##### lib\_player

The base structure for players.

Traits: **lib\_root**

Verbs:

| Verb                         | 
| ---------------------------- |
| i*nventory                   | 
| say any                      |
| ch\*at any                   |   
| who                          |
| help                         |

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| announceSay                 |               |
| setMode                     |               |
| nextMode                    |               |
| onTabKeyPress               |               |
| renderPrompt                |               |

Properties:

| Property                    | Description   |
| --------------------------- | ------------- |
| mode : WorldObject          | Current player mode |

Triggers: none

##### lib\_npc

The base structure for non-player characters. This is just a demo, so we don't
really know what NPCs are - but we'd probably like them to have extra features in the
future.

Traits: **lib\_root**

Verbs: none

Functions: none

Properties: none

Triggers: none

##### lib\_npc\_seller

The base structure for a simple seller NPC characters. The goods available for sale are in the object's contents. The 'list' command allows getting the list of goods, and the 'order' command to obtain one.

Traits: **lib\_npc**

Verbs:

| Verb                         | 
| ---------------------------- |
| list                         | 
| order/buy any                | 

Functions:

| Function                    | Description   |
| --------------------------- | ------------- |
| annonceSale                 | Defines the message displayed in the room when the sale is concluded |

Properties: none

Triggers: none