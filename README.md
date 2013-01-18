jsmoo (tentative title)
=======================

A [MOO](http://en.wikipedia.org/wiki/MOO) written in coffeescript running on node.js.

MOO stands for Mud, Object Oriented. One of the original MOOs was [LambdaMoo](http://en.wikipedia.org/wiki/LambdaMOO), developed at Xerox PARC.

The basic idea is to have a MUD which (privelaged) players can extend while in game.  You can create and edit objects, locations, and code from inside the MOO.

jsmoo is different from other MOOs because:

1. It uses [CoffeeScript](http://coffeescript.org/) as the programming language instead of the original MOO language or some other custom language.
2. You connect using a web browser, not a telnet or mud client.
3. You can edit the game code in the browser, using a fairly decent in-browser code editor ([Ace](http://ace.ajax.org/)).

Usage
-----

Clone this repo, copy the example db, and launch the server:

    git clone git@github.com:doughsay/jsmoo.git
    cd jsmoo
    cp db.example.json db.json
    ./server.coffee

Connect to is using a web browser by going to [http://localhost:8888/](http://localhost:8888/).

Programming
-----------

If you are signed in as a programmer, you can evaluate any CoffeeScript code by using the *eval* command ( *;* shorthand).

    eval 2 + 2
    -> 4

    ;Math.pow 2, 4
    -> 16

### Eval context

The eval context contains these global variables:

* `$player` - the object representing you, the player.
* `$here` - the object representing your current location.

You also have access to some global functions:

#### `$(id)`

Retrieve the object with the given `id`.

#### `list()`

Returns a list all objects in the database with their `id` and `name` fields.


#### `tree([id])`

Returns the object inheritance tree.

* `id` - (optional) Use object `id` as the root.

#### `locations([id])`

Return a tree representing objects' locations.  Top level objects in this tree are 'nowhere', and inner nodes are contained within their parents.

* `id` - (optional) Only show object `id` and it's contents.

### Object methods

Calling methods on objects is simple:

    $(6).location()

These methods are available on moo objects:

#### `parent`

Returns the parent object of this object, or `null` if this object has no parent.

#### `location`

Returns the location object of this object, or `null` if this object is 'nowhere'.

#### `moveTo(target)`

Moves this object to be contained inside the target object.

* `target` - The target object

#### `contents`

Returns an array of objects that are contained in this object.

#### `addProp(key, value)`

Adds a new property to this object.

* `key` - (string) The key to store the property under.  If it already exists it will be overwritten.
* `value` - The value to store.  Can be any type.

#### `rmProp(key)`

Removes a property from an object.

#### `getProp(key)`

#### `setProp(key, value)`

#### `chparent(id)`

#### `rename(name)`

#### `updateAliases(aliases)`

#### `clone(newName, newAliases = [])`

#### `createChild(newName, newAliases = [])`

### Verbs

To edit verbs on objects, use this syntax:

    #4.examine

This will load the verb 'examine' of object 4 into the verb editor.

The verb context has different variables available to it.  They are as follows:

* `$this` - the object the verb was called on
* `$player` - the player who called the verb
* `$here` - the player's location
* `$dobj` - the direct object, if any, that was specified when calling the verb
* `$iobj` - the indirect object, if any, that was specified when calling the verb
* `$verb` - the verb's name
* `$argstr` - the entire string that was specfied not including the verb's name
* `$dobjstr` - the direct object string
* `$prepstr` - the preposition string
* `$iobjstr` - the indirect object string

The verb context also has access to the `$` global function.

TODO
----

### Moo functionality

* Better object matching (See first big comment in lib/moo.coffee)
* Better verb matching (See second big comment in lib/moo.coffee)
* Using 'this' as the direct/indirect object argument specifier for verbs doesn't work yet
* Preposition argument specifiers need some work.  Some prepositions are synonymous, e.g. 'with' and 'using' should be interchangable.  "open door with key" / "open door using key"
* There should be a fallback function to catch un-recognized commands, like the 'huh' verb in LambdaMoo.