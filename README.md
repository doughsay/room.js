jsmoo (tentative title)
=======================

A [MOO](http://en.wikipedia.org/wiki/MOO) written in coffeescript running on node.js.

MOO stands for Mud, Object Oriented. One of the original MOOs was [LambdaMoo](http://en.wikipedia.org/wiki/LambdaMOO), developed at Xerox PARC.

The basic idea is to have a MUD which (privelaged) players can extend while in game.  You can create and edit objects, locations, and code from inside the MOO.

jsmoo is different from other MOOs because:

1. It uses [CoffeeScript](http://coffeescript.org/) as the programming language instead of the original MOO language or some other custom language.
2. You connect using a web browser, not a telnet or mud client.
3. You can edit the game code in the browser, using a fairly decent in-browser code editor ([Ace](http://ace.ajax.org/)).

Running the Server
------------------

Clone this repo, copy the example db, and launch the server:

    git clone git@github.com:doughsay/jsmoo.git
    cd jsmoo
    cp db.example.json db.json
    ./server.coffee

Connect to it using a web browser by going to [http://localhost:8888/](http://localhost:8888/).

The provided example db has one user who is also a programmer: username=root, password=p@ssw0rd.

Programming
-----------

If you are signed in as a programmer, you can evaluate any CoffeeScript code by using the *eval* command (; shorthand).

    eval 2 + 2
    -> 4

    ;Math.pow 2, 4
    -> 16

Eval Context
------------

The eval context contains these global variables:

* `$player` - the object representing you, the player.
* `$here` - the object representing your current location.

You also have access to some global functions:

### `$(id)`

Retrieve the object with the given `id`.

### `list`

Returns a list all objects in the database with their `id`, `name` and `var` fields.

### `tree(id = undefined)`

Returns the object inheritance tree.

* `id` - (int) (optional) Use object `id` as the root.

### `locations(id = undefined)`

Return a tree representing objects' locations.  Top level objects in this tree are 'nowhere', and inner nodes are contained within their parents.

* `id` - (int) (optional) Only show object `id` and it's contents.

Objects
-------

You can find objects in two ways.  The above $() method will retrieve objects if you know their `id`.  Some objects have `var` names associated with them.  To access these objects (e.g. object 0, the root object) just type it's var name after a $:

    $root


Object methods
--------------

Calling methods on objects is simple:

    $player.parent()

These methods are available on moo objects:

### `parent`

Returns the parent object of this object, or `null` if this object has no parent.

### `location`

Returns the location object of this object, or `null` if this object is 'nowhere'.

### `moveTo(target)`

Moves this object to be contained inside the target object.

* `target` - (object) The target object

### `contents`

Returns an array of objects that are contained in this object.

### `addProp(key, value)`

Adds a new property to this object.

* `key` - (string) The key to store the property under.  If it already exists it will be overwritten.
* `value` - (any) The value to store.  Can be any type.

### `rmProp(key)`

Removes a property from an object.

* `key` - (string) The key to remove.

### `getProp(key)`

Retrieve the value of a property.

* `key` - (string) The key to retrieve.

### `setProp(key, value)`

Same as `setProp`.

* `key` - (string) The key to store the property under.  If it already exists it will be overwritten.
* `value` - (any) The value to store.  Can be any type.

### `chparent(id)`

Change the parent object that this object inherits from.

* `id` - (int) The id of the object to be the new parent, or `null` for no parent.

### `rename(name)`

Renames the object.

* `name` - (string) The new name for the object.

### `setVar(varname)`

Sets the var name for this object.  After setting it, you can refer to the object using `$varname`.

* `varname` - (string) The new var name for this object, or `null` to unset it.

### `updateAliases(aliases)`

Changes the list of aliases for this object.

* `aliases` - (array[string]) The list of new aliases for this object.

### `addVerb(name, dobjarg = 'none', preparg = 'none', iobjarg = 'none')`

Loads a new verb into the verb editor.  The verb is added once you click 'save'.

* `name` - (string) The name of the verb.
* `dobjarg` - (string) The direct object argument specifier. One of ('this', 'any' or 'none')
* `preparg` - (string) The preposition argument specifier.  One of ('this', 'any', 'none' or one of the prepositions specified below)
* `iobjarg` - (string) The indirect object argument specifier.  One of ('this', 'any' or 'none')

The following are the recognized prepositions:

* with/using
* at/to
* in front of
* in/inside/into
* on top of/on/onto/upon
* out of/from inside/from
* over
* through
* under/underneath/beneath
* behind
* beside
* for/about
* is
* as
* off/off of

### `editVerb(name)`

Loads the given verb into the verb editor.  It's saved once you hit the 'save' button.

* `name` - (string) The name of the verb to edit.

### `rmVerb(name)`

Deletes the specified verb from this object.

* `name` - (string) The name of the verb to delete.

### `clone(newName, newAliases = [])`

Creates a clone of this object, copying all its properties and verbs.

* `newName` - (string) The name of the new object.
* `newAliases` - (array[string]) (optional) The list of aliases for the new object.

### `createChild(newName, newAliases = [])`

Creates a child of this object.  The child inherits all of its properties and verbs.

* `newName` - (string) The name of the new object.
* `newAliases` - (array[string]) (optional) The list of aliases for the new object.

Verbs
-----

To edit verbs on objects, use the object methods `addVerb`, `editVerb` and `rmVerb` described above.

    $(4).editVerb 'examine'

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

The verb context also has access to the `$` global function, and any global object var names.

TODO
----

### Moo functionality

* Better object matching (See first big comment in lib/moo.coffee)
* Better verb matching (See second big comment in lib/moo.coffee)
* Using 'this' as the direct/indirect object argument specifier for verbs doesn't work yet
* Preposition argument specifiers need some work.  Some prepositions are synonymous, e.g. 'with' and 'using' should be interchangable.  "open door with key" / "open door using key"
* There should be a fallback function to catch un-recognized commands, like the 'huh' verb in LambdaMoo.
* Logout
* Remove database assumptions from the server code (player creation)