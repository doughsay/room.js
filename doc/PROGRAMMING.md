# Building and programming your own Room.JS MUD/MOO world

This guide is intended for players with developer privileges in the game.

## Introduction

Once you have been given developer privileges (or by default, on the demonstration), you can use the **eval** command to prefix code instructions, or preferably cycle to the EVAL mode.

> For the reminder, in the game client, you can cycle between different modes by hitting TAB. 
> Modes effectively just prefix whatever you type with another word. 
 
You can then use any JavaScript (ES6) construct to start creating new rooms and objects. This document therefore assumes the reader has pre-existing JavaScript knowledge. You will need to learn but a few basic Room.JS-specific concepts only:

- Toplevel functions: there are a few global functions, such as **all()**. Some are seldom used in actual code, but are provided as utilities for you to invoke on the command line. Others, such as **nextId()**, will be of more frequent use.
- World objects:
  - Each object in the world has a unique identifier, which also corresponds to its name in the global scope.
    - You may reference an object by its identifier: `$('lib.room')`
    - Or rather, directy by its global variable:  `lib.room`
    - Identifiers are internally mapped to a file path by the DB (e.g. "lib.room" will be mapped to "lib/room"). This allows  organizing the objects logically -- You can create objects at any level, but it is a **good practice** to enquire your game administrator regarding the recommended naming scheme. Please also refer to the [Customization guide](CUSTOMIZING.md)
  - Objects can include, as usual, properties and functions, but they can also have verbs.
    - To add a new function: `obj.foo = function foo()` {} 
    - To add a new verb: `obj.bar = Verb("bar")`
    - In the web client, to edit verbs and functions, use **Ctrl-p** (or **Cmd-p**) to open the fuzzy-search. Search for a function or verb by name and hit enter to start editing.
- Verbs: these are special functions invoked when a corresponding command from the player has succesfully been parsed.
- Traits: the object-oriented programming in Room.JS relies on traits. Any world object can be used as a trait in other objects, and can have several traits. This is how an object can be used to extend the functionality of another object.

For more details, see also the [Reference guide](#reference-guide) further below.

## Example

But for now, let's create our first object: a (very) basic lantern!
First, switch to EVAL mode, so that you do not have to prefix every JavaScript command.

- Create a new object. In the demonstration mudlib, **lib.item** is a gettable and describable object. So we will start from it (i.e. it will be the base trait for our object)
```javascript
lib.item.new('tests.lantern');
```
- By default, its short name is the same as its identifier, and it doesn't have a long description. It doesn't have aliases either. This is not very convenient, so let's add all these things:
```javascript
tests.lantern.name = "lantern";
tests.lantern.addAlias("lamp");
tests.lantern.description = "a portable lamp in a case, protected from the wind and rain";
```
- Since it is intended for being lit, let's add a boolean property to keep track of that state:
```javascript
tests.lantern.lighted = false; 
```
- This is a step-by-step example, but actually note that we could rather have added most of the properties directly at creation, specified as options:
```javascript
lib.item.new('tests.lantern', { name: "lantern", lighted: false });
```

- Anyhow, let's now declare the available command verbs:
```javascript
tests.lantern.light = Verb("light", "this", "none", "none");
tests.lantern.extinguish = Verb("extinguish", "this", "none", "none");
```
- Hit Ctrl-p and look for our newly created "light" verb. In the editor, copy the following function body into the default template (i.e. keep the surrounding function definition!)
```javascript
  if (!this.lighted) {
    this.doLight(player);
  } else {
    player.tell(`The ${this.name} is already lit.`);
  }
```
- Save with Ctrl-s, and then proceed similarly for the "extinguish" verb:
```javascript
  if (this.lighted) {
    this.doExtinguish(player);
  } else {
    player.tell(`The ${this.name} is not lit.`);
  }
```
- Close the editing tabs and return to the MUD tab. Here, for the sake of illustration, we decided to use two additional functions, that will be responsible for changing the state flag and announce something to other people in the room. So let's first create them:
```javascript
tests.lantern.doLight = function(player) {};
tests.lantern.doExtinguish = function(player) {};
```
- And again, hit Ctrl-p and look for these functions. Insert the following content inside the body for the doLight method, and save with Ctrl-s:
```javascript
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
- And likewise for doExtinguish...
```javascript
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
- Go back to the MUD tab. We will want to test our new object, so let's bring it to our current room (and notice how the *this* object conveniently here points to you, the player/builder):
```javascript
tests.lantern.location = this.location
```

- Leave the EVAL mode, and play:
```
look lamp
extinguish lamp
light lamp
light lamp
extinguish lamp
```

There you go! Well, the description should probably indicate whether our little lantern is lit or not. That's basic programming, so it's up to you now.

## Reference guide

### Toplevel global functions

##### all() ⇒ Array.WorldObject
Returns a list of all existing world objects.

##### nextId( String ) ⇒ String
Returns a new unique identifier from the text provided. Very useful when you create objects, and want an identifier following the same naming scheme, and as long as no one else takes that identifier in the meantime -- So usually, this is used directly in the object creation call.

##### allPlayers() ⇒ Array.WorldObject
Returns a list of all existing player world objects (i.e. player characters).

##### $( String ) ⇒ WorldObject|undefined
Returns a world object by its identifier, if it exists.

##### Verb( pattern, dobjarg?, preparg?, iobjarg? ) ⇒ Command
Creates a command verb.

| Parameter | Type      | Comment  | 
| --------- | --------- | ------------ |
| pattern   | String    | Verb pattern(s) |
| dobjarg   | String?   | Direct object |
| preparg   | String?   | Preposition(s) |
| iobjarg   | String?   | Indirect object |

- The verb pattern can consists in several patterns separated by a space, that will be recognized alike. Each pattern can include a \* sign for defining shortcuts. E.g., "l\*ook ex\*amine" will match "look", "l", "examine" and "ex".
- Possible values for optional direct/indirect objects are "this", "any", "none" (default).
- Several prepositions may be provided, separated with a /.
- Recognized prepositions: "with", "using", "at", "to", "in front of", "in", "inside", "into", "on top of", "on", "onto", "upon", "out of", "from inside", "from", "over", "through", "under", "underneath", "beneath", "behind", "beside", "for", "about", "is", "as", "off of", "off".

Example:
```javascript
Verb("put", "any", "in/into", "this");
```

Verbs then have the following signature:
```javascript
function({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr })
```

When the function is invoked:
- The *this* variable refers to the world object implementing the command,
- *player* is the player world object who triggered the command,
- *dobj* and *iobj* are the direct and indirect object of the command, that is either a world object (if found) or one of the core objects **fail**, **nothing** and **ambiguous**,
- *verbstr, argstr, dobjstr, prepstr, iobjstr* are the parsed raw strings, see **parse()** just below.

##### parse( String ) ⇒ Command
Invokes the sentence parser on a string. Explanation by example is easier:
```javascript
parse("put trash in can");
⇒ { verb: 'put', dobjstr: 'trash', prepstr: 'in', iobjstr: 'can', argstr: 'trash in can' }
}
```

This may be used to check how a command will be split and passed to a Verb function.

##### noun( String ) ⇒ [String, String]
Invokes the noun parser on a string, separating the determiner (if any) and the noun. This may have some use when formatting messages.
Examples:
```javascript
noun("any lantern"); ⇒ ['any', 'lantern']
noun("lantern"); ⇒ [undefined, 'lantern']
noun("lantern.1"); ⇒ ['1', 'lantern']
```

Recognized determiners are 'all' (for a collection), 'a', 'an', 'any' (all mapped to 'any', for any indefinite random item in a collection),
'the' or undefined (both mapped to undefined, assuming definiteness by default), or a string containing an ordinal index (i.e. rank in a collection), either prefixed ("2.lantern") or suffixed ("lantern.2" or "lantern 2"). 

##### color.*( String ) ⇒ String
Colorizes a string.
```javascript
var boldBlueText = color.bold.blue("Some text");
```

The available features are those provided by [Chalk](https://github.com/chalk/chalk).

##### run.in( String, Integer ) ⇒ Timer
Schedules code for delayed execution (delay in ms). That's Room.JS friendly way of exposing a setTimeout-like method, persisting across server restarts.

##### run.every( String, Integer ) ⇒ Timer
Schedules code for periodical execution (interval in ms). That's Room.JS friendly way of exposing a setInterval-like method, persisting across server restarts.

```javascript
// Call this object's ticks() method every 500ms.
this.timerId = run.every(this.id + '.ticks()', 500);
```

##### run.next( String ) ⇒ Timer
Schedules code for immediate execution at the end of this turn of the internal event loop. That's Room.JS friendly way of exposing a setImmediate-like method, persisting across server restarts.

##### run.cancel( Timer ) ⇒ Boolean
Cancels a timer, returning true on success or false if the timer no longer exists.

##### run.check( Timer ) ⇒ Boolean
Checks if a timer exists.

##### run.list() ⇒ Timer
Lists all timers currently running.
 
##### global

The global namespace, i.e. an object containing all of the above functions, and all toplevel objects or namespaces.

### World objects

#### Base properties
All world objects have at least the following properties:

| Property  | Type                | Comment  |
| --------- | ------------------- | ------------ |
| player    | Boolean             | True if object is a player (read-only) |
| online    | Boolean             | True for a connected player (read-only) |
| id        | String              | Unique identifier (read-only) |
| name      | String              | Name |
| aliases   | Array.String        | List of aliases |
| traits    | Array.WorldObject   | List of traits |
| location  | WorldObject\|null   | Location |
| contents  | Array.WorldObject   | List of objects -- All objects can therefore all be containers. |

For the record:
- The *player* property actually checks whether the object has an *userId* property (which can't be added manually),
- The *online* property is actually a getter, querying the connection controller,
- The *id* property is internally mapped to a file path by the DB. 

Moreover, there are a few optional properties used by the game engine:

| Property   | Type                | Comment  |
| ---------- | ------------------- | ------------ |
| userId     | String              | (On a player.) User login name. |
| programmer | Boolean             | (On a player.) True if the player has programmer privileges. |
| extraMatchObjects | Array.WorldObject\|Function | (On a location.) Hook, see look-up functions below. For a somewhat advanced usage. |
| verbMissing | Verb               | (On a location.) Hook, see [Customization guide](CUSTOMIZING.md) |
| onLocationChanged | Function     | (On any object.) Hook, see [Customization guide](CUSTOMIZING.md) |
| onTabKeyPress | Function         | (On a player.) Hook, see [Customization guide](CUSTOMIZING.md) |

#### Base methods
As a programmer, these are the methods you will most likely use very often.

##### new(String, Object?) ⇒ WorldObject
Creates a new world object, deriving from its parent (i.e. having it in its traits array).

| Parameter  | Type                | Comment  |
| ---------- | ------------------- | ------------ |
| id         | String              | Unique identifier |
| props      | Object              | Optional properties to be copied into the object |

Example:
```javascript
lib.chest.new("items.chest2", { name: "large chest", opened: false, locked: false });
```

Note: The identifier is 'sanitized', i.e. non-authorized characters are removed or replaced.

##### destroy() ⇒ Boolean
Removes an object from the world and its database. Currently returns true.

##### addAlias( ...String ) ⇒ Integer
Adds alias strings to the object and returns the number of aliases.

> Warning: For efficiency, it doesn't prevent from adding an existing alias. There's no real point having the same alias declared more than once, but it is left to the in-game code to performs the relevant checks, if need be.

##### rmAlias( ...String ) ⇒ Integer
Removes alias strings from the object (any duplicates will be removed), and returns the number of aliases.

##### addTrait( ...WorldObject ) ⇒ Integer
Adds traits to the object and returns the number of traits. Traits are what makes the object inherit properties and methods.

> Warning: Use with caution. For efficiency, it doesn't prevent from adding an already existing trait. There are cases where duplicate traits will result in the object being broken (with a 'duplicate parent'), and no longer useable. You might have to edit the on-disk object file to fix such situations.

##### rmTrait( ...String ) ⇒ Integer
Removes traits from the object and returns the number of traits.

> Warning: Use with caution. Removing an object used as trait in other objects may lead to bad things. 
> Anyhow, it is probably a bad idea to remove a parent trait object, as the inheriting objects may likely be broken afterwards.

#### Look-up methods
These are methods you may need when implementing complex verbs, where you may want to
check if an item can be found in a container, a location, etc.

##### findNearby( String ) ⇒ WorldObject
Looks if a string can be matched to an object in the environment, that is:
- the object's contents,
- its location's contents,
- the location's extraMatchObjects, if defined. This allows specifying additional objects that may also be matched (e.g. a door, a sign, etc.) despite not appearing in the location's contents. This may either be an array or a function (for returning a dynamical list of objects).

Returns:
- the core object **fail** when there is no match,
- the core object **ambiguous** if there are more than one match,
- otherwise, the matched object.

##### findObject( String ) ⇒ WorldObject
Looks if a string can be matched to an object in the environment. This is a convenience function over findNearby(), also accepting the strings "me", "myself" and "here" to be matched.

Returns: 
- the object itself (= *this*) if the string is "me" or "myself",
- the location (= *this.location*) if the string is "here",
- otherwise, **fail**, **ambiguous** or a matched object.
  
##### findInside( String ) ⇒ WorldObject
Looks inside the object's contents if a string can be matched to an object.

Returns:
- the core object **fail** when there is no match,
- the core object **ambiguous** if there are more than one match,
- otherwise, the matched object.

#### Verb related methods
For advanced usage. 

Check the **items.builderstaff** item or the **lib.traits.commandable** trait in the demonstration for possible use cases. 

##### matchObjects( command : String ) ⇒ Object
Given a command, returns { dobj : WorldObject, iobj : WorldObject }, containing the matched objects in the environment.

##### matchVerb( command : String, Object ) ⇒ Object|null
Given a command and the result from matchObjects(), returns an object { verb: Function, this: WorldObject }, corresponding to the first matched verb and the target object, or null in case there is no match.

#### Other methods
They exist in the execution context, but are probably of lower interest.

##### send( String\|Object ) ⇒ Boolean
Sends a message to the client.

This is normally not intended to be used directly (e.g. check the **tell()** method, defined by the **lib.root** object inherited by allmost all objects in the demo mudlib).

Returns true upon success, false upon failure (no controller, e.g. not a player, or player not connected). 

Note: Sending a JavaScript object also works, assuming it is [transferable](https://www.w3.org/TR/html5/infrastructure.html#transferable-objects) (and that the client side knows what to do with it, obviously).

##### linearize() ⇒ Array.WorldObject
Returns the trait inheritance hierarchy. It could be useful to check if an object has a given trait via inheritance, see instanceOf() below for that purpose.

##### instanceOf( WorldObject ) ⇒ Boolean
Checks if the object is an instance of another object, i.e. if the former has the latter in its trait inheritance hierarchy.

Basically, it just linearizes the object, and checks whether the other object is in the returned list of traits. (Obviously, since the object-oriented programming in Room.JS is trait-based, the usual JavaScript `instanceof` operator, which operates on object's prototypes, would not work as intended.)

##### setPrompt( String ) ⇒ Boolean
Notifies the user to change his/her prompt. This is used by the mode system, when cycling between the modes (normal, say, chat, programming).

Returns true upon success, false upon failure (no controller, e.g. not a player, or player not connected).

##### setRightPrompt( String ) ⇒ Boolean
Notifies the user to change his/her right prompt. It is left to the game client to interpret what the 'right prompt' is -- Possibly some extra information, whole the regular prompt is usually reserved for notifying the player name (usually displayed on the left of the input field, hence the name of this other prompt).

Returns true upon success, false upon failure (no controller, e.g. not a player, or player not connected).

##### toString() ⇒ String
Returns [object identifier]

##### keys() ⇒ Array.String
Returns an array of a given object's own enumerable properties.

##### values() ⇒ Array.Object
Returns an array of a given object's own enumerable property values.

#### Other methods (somehow internal)

This section is provided for reference only. You are normally not supposed to need these methods (internally used by the abovementioned look-up methods) -- but these are therefore reserved property/function names.

##### matches( String ) ⇒ 0..2
Checks if an object matches a given string, comparing it against its name and its aliases.

Returns:
- 0 when not matching,
- 1 for exact match,
- 2 for partial match.

##### findVerb( Object, Object, WorldObject ) ⇒ String|undefined
Given a command and a set of matched objects, returns an applicable verb property name (or undefined, if none matches). Internally used by matchVerb(), which applies it to the object first, then to its location, and finally to the command direct and indirect objects.
