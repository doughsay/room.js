# Building and programming your own RoomJS MUD/MOO world

This guide is intended for "builders", i.e. players with developer privileges in the game.

## Introduction

Once you have been given developer privileges (or by default, on the demo mudlib), you can use the **eval** command to prefix code instructions, or preferably cycle to the EVAL mode.

> For the reminder, you can cycle between different modes by hitting TAB. 
> Modes effectively just prefix whatever you type with another word. 
 
You can then use any JavaScript (ES6) construct to start creating new rooms and objects. You will need to learn but a few basic RoomJS-specific concepts only:

- Toplevel functions: there are a few convenience global functions, such as **all()** and **nextId()**, etc. They are seldom used in actual code, but are provided as utilities for you to invoke on the command line.
- World objects:
  - Each object in the world has a unique identifier, which also corresponds to its name in the global scope.
    - You may reference an object by its identifier: `$('lib_room')`
    - Or rather, directy by its global variable:  `lib_room`
    - Identifiers are internally mapped to a file path by the DB, with the underscore character corresponding to the path separator (e.g. "lib_room" will be mapped to "lib/room"). This allows  organizing the objects logically -- You can create objects at any level, but it is a **good practice** to enquire your game administrator regarding the recommended naming scheme. Please also refer to the [Builder guide](CUSTOMIZING.md)
  - Objects can include, as usual, properties and functions, but they can also have verbs.
    - To add a new function: `obj.foo = function foo()` {} 
    - To add a new verb: `obj.bar = Verb("bar")`
    - In the web client, to edit verbs and functions, use **Ctrl-p** (or **Cmd-p**) to open the fuzzy-search. Search for a function or verb by name and hit enter to start editing.
- Verbs: these are special functions invoked when a corresponding command from the player has succesfully been parsed.
- Traits: the object-oriented programming in RoomJS relies on traits. Any world object can be used as a trait in other objects, and can have several traits. This is how an object can be used to extend the functionality of another object.

For more details, see also the [Reference guide](#Reference-guide) further below.

## Example

But for now, let's create our first object: a (very) basic lantern!
First, switch to EVAL mode, so that you do not have to prefix every JavaScript command.

1. Create a new object. In the demo mudlib, **lib_item** is a gettable and describable object. So we will start from it (i.e. it will be the base trait for our object)
```
lib_item.new('tests_lantern');
```
2. By default, its short name is the same as its identifier, and it doesn't have a long description. It doesn't have aliases either. This is not very convenient, so let's add all these things:
```
tests_lantern.name = "lantern";
tests_lantern.addAlias("lamp");
tests_lantern.description = "a portable lamp in a case, protected from the wind and rain";
```
3. Since it is intended for being lit, let's add a boolean property to keep track of that state.
```
tests_lantern.lighted = false; 
```
4. Now, let's declare the available command verbs.
```
tests_lantern.light = Verb("light", "this", "none", "none");
tests_lantern.extinguish = Verb("extinguish", "this", "none", "none");
```
5. Hit Ctrl-p and look for our newly created "light" verb. In the editor, copy the following function body into the default template (i.e. keep the surrounding function definition!)
```
  if (!this.lighted) {
    this.doLight(player);
  } else {
    player.tell(`The ${this.name} is already lit.`);
  }
```
6. Save with Ctrl-s, and then proceed similarly for the "extinguish" verb:
```
  if (this.lighted) {
    this.doExtinguish(player);
  } else {
    player.tell(`The ${this.name} is not lit.`);
  }
```
7. Close the editing tabs and return to the MUD tab. Here, for the sake of illustration, we decided to use two additional functions, that will be responsible for changing the state flag and announce something to other people in the room. So let's first create them:
```
tests_lantern.doLight = function(player) {};
tests_lantern.doExtinguish = function(player) {};
```
8. And again, hit Ctrl-p and look for these functions. Insert the following content in the body for the doLight method, and save with Ctrl-s.
```
  function announce(sender, recipient, object) {
    if (sender === recipient) {
      return `You light the ${object.name}.`;
    }
    return `${sender.name} lights a ${object.name}.`;
  }
  
  if (player.location) {
    player.location.announce(announce, player, this);
  }
  this.lighted = true;
```
9. And likewise for doExtinguish...
```
  function announce(sender, recipient, object) {
    if (sender === recipient) {
      return `You extinguish the ${object.name}.`;
    }
    return `${sender.name} extinguishes a ${object.name}.`;
  }
  
  if (player.location) {
    player.location.announce(announce, player, this);
  }
  this.lighted = false;
```
10. Go back to the MUD tab. We will want to test our new object, so let's bring it to our current room (and notice how the *this* object conveniently here points to you, the player/builder):
```
tests_lantern.location = this.location
```

11. Leave the EVAL mode, and play.
```
look lamp
extinguish lamp
light lamp
light lamp
extinguish lamp
```

Yeah, there you go. Now, the description and short name should probably indicate whether our little lantern is lit or not. That's basic programming, so it's up to you!

## Reference guide

### Toplevel global functions

##### all() ⇒ Array.<WorldObject>
Returns a list of all existing world objects.

##### nextId( String ) ⇒ String
Returns a new unique identifier from the text provided. Very useful when you create objects, and want an identifier following the same naming scheme, and as long as no one else takes that identifier in the meantime -- So usually, this is used directly in the object creation call.

##### players() ⇒ Array.<WorldObject>
Returns a list of all existing player world objects (i.e. player characters).

##### color.*( String ) ⇒ String
Colorize a string.
```
var boldBlueText = color.bold.blue("Some text");
```

##### $( String ) ⇒ WorldObject|undefined
Returns a world object by its identifier, if it exits.

##### Verb( command, dobj?, prep?, iobj? ) ⇒ Command
Creates a command verb.

| Parameter | Type      | Comment  | 
| --------- | --------- | ------------ |
| command   | String    | Command name(s) |
| dobj      | String?   | Direct object |
| prep      | String?   | Preposition   |
| iobj      | String?   | Indirect object |

- The command can include several patterns separated by a space, that will be recognized alike. Each pattern can include a * sign for shortcuts. E.g., "l*ook ex*amine" will match "look", "l", "examine" and "ex".
- Possible values for optional direct/indirect objects are 'this', 'any', 'none' (default).
- Several prepositions may be provided, separated with a /.
- Recognized propositions: 'with', 'using',  'at', 'to',  'in front of',  'in', 'inside', 'into',
  'on top of', 'on', 'onto', 'upon',  'out of', 'from inside', 'from',  'over',  'through',
  'under', 'underneath', 'beneath',  'behind', 'beside', 'for', 'about', 'is', 'as',
  'off of', 'off'.

Example:
```
Verb("put", "any", "in/into", "any");
```

Verbs then have the following signature:
```
function({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr })
```

The **this** variable refers to the word object implementing the command, **player** is the player world object who triggered the command, and the remaining parameters correspond to the parsed fields (in world object form if found, and in string form -- see **parse()** below)

##### parse( String ) ⇒ Command
Invokes the command parser on a string. Explanation by example is easier:
```
parse("put trash in can");
⇒ { verb: 'put', dobjstr: 'trash', prepstr: 'in', iobjstr: 'can', argstr: 'trash in can' }
}
```

This may be used to check how a command will be split and passed to a Verb function.

### World objects

#### Base properties
All world objects have at least the following properties:
| Property  | Type                | Comment  |
| --------- | ------------------- | ------------ |
| player    | Boolean             | true if object is a player (read-only) |
| online    | Boolean             | true when connected player (read-only) |
| id        | String              | unique identifier (read-only) |
| name      | String              | name |
| aliases   | Array.<String>      | List of aliases |
| traits    | Array.<WorldObject> | All objects can therefore be containers |
| location  | WorldObject\|null   | Location |
| contents  | Array.<WorldObject> | Objects can therefore all be containers |

For the record:
- The *player* property actually checks whether the object has an *userId* property (which can't be added manually),
- The *online* is a getter querying the connection controller,
- The *id* property is internally mapped to a file path by the DB. 

#### Base methods
As a programmer, these are the methods you will most likely use very often.

##### new(String, Object?) ⇒ WorldObject
Creates a new world object, deriving from its parent (i.e. having it in its traits array).

| Parameter  | Type                | Comment  |
| ---------- | ------------------- | ------------ |
| id         | String              | See below    |
| props      | Object              | Optional properties to be copied into the object |

Example:
```
lib_chest.new("chest2", { opened: false, locked: false });
```

##### destroy() ⇒ Boolean
Removes an object from the world and its database. Currently returns true.

##### addAlias( ...String ) ⇒ Integer
Add alias strings to the object and returns the number of aliases.
\
Warning: it doesn't prevent from adding an existing alias. Maybe it should.

##### rmAlias( ...String ) ⇒ Integer
Remove alias strings from the object (any duplicates will be removed), and returns the number of aliases.

##### addTrait( ...WorldObject ) ⇒ Integer
Add traits to the object and returns the number of traits. Traits are what makes the object inherit properties and methods.
\
Warning: it doesn't prevent from adding an existing alias. Maybe it should.

##### rmTrait( ...String ) ⇒ Integer
Remove traits from the object and returns the number of traits.

#### Other methods
They exist in the execution context, but are propably of lower interest.

##### send( String\|Object ) ⇒ Boolean
Sends a message to the client.
\
This is normally not intended to be used directly (e.g. check **tell()** method, defined by the **lib_root** object inherited by allmost all objects in the demo mudlib).
\
Returns true upon success, false upon failure (no controller, e.g. not a player, or player not connected). 
\
Note: Sending an object also works, assuming it is transferable. 

##### linearize() ⇒ Array.<WorldObject>
Returns the trait inheritance hierarchy. Could be useful to check if an object has a given trait via inheritance.

##### setPrompt( String ) ⇒ Boolean
Notifies the user to change his/her prompt. This is used by the mode system (see **modes** in the demo mudlib), when cycling between the modes (normal, say, chat, programming).
\
Returns true upon success, *false upon failure (no controller, e.g. not a player, or player not connected).

##### toString() ⇒ String
Returns [object <identifier>]

##### keys() ⇒ Array.<String>
Returns an array of a given object's own enumerable properties.

##### values() ⇒ Array.<Object>
Returns an array of a given object's own enumerable property values.

#### Other methods (WIP)

Documentation not yet completed, work in progress...

##### matchObjects( command ) ⇒ WordObject
TBD.
May return world object **nothing**

##### findObject( String ) ⇒ WordObject
TBD.
String "me" (or "myself") returns the object itself (= this).
String "here" returns the location (= this.location)
Otherwise, call findNearby().
May therefore

##### findNearby( String ) ⇒ WordObject
TBD. May return world objects **fail** or **ambiguous**
Looks in the object itself, in its location, in an extraMatchObjects 
property (which may be an array or a function to call) in the location if any,

##### findInside( String ) ⇒ WordObject
TBD. May return world objects **fail** or **ambiguous**

##### findMatch( -,- ) ⇒ WordObject
TBD.

##### matchVerb( ... ) ⇒ ...
TBD.

##### findVerb( ... ) ⇒ ...
TBD.