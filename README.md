# room.js

A [MOO](http://en.wikipedia.org/wiki/MOO) running on node.js.

MOO stands for Mud, Object Oriented. One of the original MOOs was [LambdaMoo](http://en.wikipedia.org/wiki/LambdaMOO), developed at Xerox PARC.

The basic idea is to have a MUD which (privileged) players can extend while in game.  You can create and edit objects, locations, and code from inside the MOO.

room.js is different from other MOOs because:

1. It uses plain JavaScript as the programming language instead of the original MOO language or some other custom language.
2. You connect using a web browser, not a telnet or mud client.
3. You can edit the game code in the browser, using a fairly decent in-browser code editor ([Ace](http://ace.ajax.org/)).

This repository contains the room.js server.

## Connecting and basic usage

To interact with the room.js server, you must use the client app.  The [client](https://github.com/doughsay/room.js-client) is in a separate repository [here](https://github.com/doughsay/room.js-client).  It's mostly self explanatory, you type commands to send to the server and the server responds.

## API

### Global functions and getters

#### `verb(pattern, dobjarg = 'none', preparg = 'none', iobjarg = 'none', code = 'function() {}') -> verb`

Create a new verb. Example usage: `Room.look = verb('l*ook')`.  See the section about writing verbs below for more details.

#### `search(string) -> [worldObject]`

Get an array of all world objects that match a search string. Searches names, ids, and aliases.

#### `$(idString) -> worldObject`

Return a world object based on its id.  Of course, you can also refer to them as global objects, i.e. `Root` instead of `$('Root')`.

#### `nextId(string) -> string`

Returns the next available id by maybe appending a number to the end of the input string.

Example:

```javascript
nextId('Root') // -> 'Root1'
```

#### `getter Cron`

The Cron object.  See section below on scheduling and managing cron jobs.

#### `getter players`

An array of all player objects.

#### `getter all`

An array of all world objects.

### Object API

All functions / properties below are on world objects (or players where indicated).

#### `worldObject.toString() -> string`

String representation of an object.

#### `worldObject.isA(worldObject) -> boolean`

Checks if an object inherits from another object.

#### `worldObject.destroy()`

Permanently removes an object from the world.

#### `worldObject.new(params) -> worldObject`

Creates a new child of an object.

Example:

```javascript
Root.new({id: 'Apple', name: 'Apple'})
```

`id` and `name` are required, but you may also pass `aliases` as an array of strings.

Note: the `nextId` helper function can help in generating uniqe ids.

#### `worldObject.contents() -> [worldObject]`

Returns all objects within an object.

#### `worldObject.children() -> [worldObject]`

Returns all objects that are children of an object.

#### `getter/setter worldObject.parent -> worldObject`

Get or set the parent of an object. Can be `null`.

#### `getter/setter worldObject.location -> worldObject

Get or set the location of an object. Can be `null`.

#### `getter/setter worldObject.name -> string`

Get or set the name of an object. Must be a string.

#### `getter/setter worldObject.aliases -> [string]`

Get or set the aliases of an object. Must be an array of strings.

Note: because this is a getter, you can't directly manipulate the array.

Example:

```javascript
// instead of:
Sword.aliases.push('sword')
// do
Sword.aliases = ['sword']
// or
Sword.aliases = Sword.aliases.concat(['sword'])
```

#### `getter worldObject.isPlayer -> boolean`

Check if an object is a player or not.

#### `getter player.isOnline -> boolean`

Checks if the player is online or not.

#### `getter/setter player.isProgrammer -> boolean`

Get or set the `isProgrammer` field of a player. A programmer is allowed access to the `eval` command, as well as the ability to edit verbs and functions using the build in editor.

#### `getter player.lastActivity -> Date`

Gets the last activity time of a player.

#### `player.send(string) -> boolean`

Sends a message to a player. If the player is online, returns `true`, otherwise `false`.

#### `player.ask(message, callback) -> boolean`

Asks for input from a player. If the player is online, returns `true`, otherwise `false`. `message` can be a string, or an object with optional keys:

* `string: message` will be a message sent to the player upon requesting input.
* `string: prompt` will (temporarily) set the player's prompt to the given string.
* `boolean: password` will hide what the player types (i.e. a password field).

#### `player.prompt(string) -> boolean`

Sets the prompt of a player. If the player is online, returns `true`, otherwise `false`.

#### `worldObject.edit(propertyName)`

Opens an edit tab for the given property on an object. `propertyName` must be the name of a function or a verb on the object.

Example:

```javascript
Room.edit('look') // opens the verb "Room.look" in a new editor tab.
```

#### `worldObject.addVerb(name, pattern)`

Adds a new verb to an object and immediately opens an edit tab with the new verb.

Example:

```javascript
Room.addVerb('look', 'l*ook') // adds and opens the verb "Room.look" in a new editor tab.
```

#### `worldObject.addFunction(name)`

Adds a new function to an object and immediately opens an edit tab with the new function.

Example:

```javascript
Room.addFunction('foo') // adds and opens the function "Room.foo" in a new editor tab.
```

### Internal global stuff you probably won't need

#### `parse(string) -> command`

Parse an input string into a command object.

#### `matchVerb(player, command, matchedObjects) -> matchedVerb`

Match a verb based on a player and matched objects.

### Internal stuff on objects you probably won't need

#### `worldObject.reload()`

Reloads an object from the database.

#### `worldObject.matchObjects(command) -> matchedObjects`

Finds the direct and indirect objects mentioned in a command.

#### `worldObject.findObject(searchString) -> worldObject`

TODO

#### `worldObject.findNearby(searchString) -> worldObject`

TODO

#### `worldObject.matches(string) -> 0|1|2`

Checks if an object matches a given string. Returns:

* 0: does not match
* 1: exact match
* 2: partial match

Examples:

```javascript
Root.matches('root') // -> 1
Root.matches('roo') // -> 2
Root.matches('room') // -> 0
```

Note: also checks `aliases` of an object.

#### `worldObject.findVerb(command, matchedObjects, self = this) -> verb`

Given a command and a set of matched objects, returns a verb (or `undefined` if no match).

Example:

```javascript
command = parse('say hello!')
matchedObjects = this.matchObjects(command)
this.findVerb(command, matchedObjects) -> 'say'
```

## Creating and editing verbs

TODO

## Scheduling and managing cron tasks

TODO
