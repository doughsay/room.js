room.js
=======

A [MOO](http://en.wikipedia.org/wiki/MOO) written in coffeescript running on node.js.

MOO stands for Mud, Object Oriented. One of the original MOOs was [LambdaMoo](http://en.wikipedia.org/wiki/LambdaMOO), developed at Xerox PARC.

The basic idea is to have a MUD which (privileged) players can extend while in game.  You can create and edit objects, locations, and code from inside the MOO.

room.js is different from other MOOs because:

1. It uses [CoffeeScript](http://coffeescript.org/) as the programming language instead of the original MOO language or some other custom language.
2. You connect using a web browser, not a telnet or mud client.
3. You can edit the game code in the browser, using a fairly decent in-browser code editor ([Ace](http://ace.ajax.org/)).

Running the Server
------------------

Assuming you already have git and node.js >= v0.7.6:

    # Get the code
    git clone git@github.com:doughsay/room.js.git
    cd room.js

    # Install supporting libraries
    npm install

    # Use the starter database
    cp db.example.json db.json

    # Launch the server
    node_modules/coffee-script/bin/coffee server.coffee

Connect to it using a web browser by going to [http://localhost:8888/](http://localhost:8888/).

The provided example db has one user who is also a programmer: username=root, password=p@ssw0rd.

The only currently implemented verbs are:

* look
* say [anything]
* examine [object]
* get [object]
* drop [object]
* swing sword

Programming
-----------

If you are signed in as a programmer, you can evaluate any CoffeeScript code by using the *eval* command (backtick '`' in shorthand).

    eval 2 + 2
    -> 4

    `Math.pow 2, 4
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

Returns a list all objects in the database with their `id` and `name` fields.

### `search(str)`

Returns a list of all objects whos name matches `str` in the database.

### `tree(id = undefined)`

Returns the object inheritance tree.

* `id` - (int) (optional) Use object `id` as the root.

### `locations(id = undefined)`

Return a tree representing objects' locations.  Top level objects in this tree are 'nowhere', and inner nodes are contained within their parents.

* `id` - (int) (optional) Only show object `id` and it's contents.

### `ls(x, depth = 2)`

Pretty print `x` to a depth of `depth`.

Objects
-------

You can find objects in two ways.  The above $() method will retrieve objects if you know their `id`.  Some objects have gobal names associated with them.  To access these objects (e.g. object 1, the root object) just type it's global name after a $:

    $root

Object attributes
-----------------

You can access attributes on objects like this:

    $thing.name

### `id`

(Int) {read-only} The objects unique id.

### `parent`

(Object) The parent of this object.  This object inherits verb and properties from it's parent, but it can be null.

### `name`

(String) The object's name.

### `aliases`

(Array[String]) Aliases that you can use to refer to this object.

### `location`

(Object) Where the object is located, if anywhere.

### `contents`

(Array[Object]) {read-only} An array of objects that are contained within this object.

### `player`

(Boolean) {read-only} Is this object a player?

### `programmer`

(Boolean) Is this object a programmer?

Custom object attributes (Properties)
-------------------------------------

You can add custom properties to objects using the method `addProp` described below.  Already existing properties can be accessed and edited like any other (java|coffee)script property, directly on the object:

    $(7).description = 'foo bar baz'

Object methods
--------------

Calling methods on objects is simple:

    $player.addProp(arg1, arg2)

These methods are available on moo objects:

### `addProp(key, value)`

Adds a new property to this object, or overwrites an existing one.

* `key` - (string) The key to store the property under.  If it already exists it will be overwritten.
* `value` - (any) The value to store.  Can be any type.

### `rmProp(key)`

Removes a property from an object.

* `key` - (string) The key to remove.

### `editVerb(verb)`

Load the verb named `verb` of the object into the verb editor.

### `addVerb(verb, dobjarg = 'none', preparg = 'none', iobjarg = 'none')`

Add a new verb to the object called `verb` and load it into the verb editor.  You can optionally specify the argument specifiers as well.

### `rmVerb(verb)`

Remove verb named `verb` from the object.

### `clone(newName, newAliases = [])`

Creates a clone of this object, copying all its properties and verbs.

* `newName` - (string) The name of the new object.
* `newAliases` - (array[string]) (optional) The list of aliases for the new object.

### `create(newName, newAliases = [])`

Creates a child of this object.  The child inherits all of its properties and verbs.

* `newName` - (string) The name of the new object.
* `newAliases` - (array[string]) (optional) The list of aliases for the new object.

Verbs
-----

To edit verbs on objects, use the object methods `addVerb`, `editVerb` and `rmVerb` described above.

    $thing.editVerb 'examine'

This will load the verb 'examine' of the 'Thing Class' into the verb editor.

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

The verb context also has access to the `$` function, as well as:

### `rm(id)`

This removes object `id` from the database.  Warning: this is irreversible.

TODO
----

* A better editor (seperate page)
* Allow in-place property edits
    * e.g. $here.exits['north'] = $exit.create 'north'
    * The above won't work because $here.exits is a getter that returns a new object, not the real underlying object
    * Don't really know how we can solve this...
* Add 'events'
    * allow players to schedule events that happen either once or periodically
    * allow periodic events to be canceled
    * persist events across server restarts

### Bugs

* Having moo objects with circular inheritence.
    * $thing.parent == $root; $root.parent = $thing
    * This causes `RangeError: Maximum call stack size exceeded`
    * Solution: add a check to the parent setter.
* Attempting to assign a circular js object as a property on a moo object causes `RangeError: Maximum call stack size exceeded`

### Things that can crash the server

* Writing moo code with infinite loops.
    * Can't solve this right now as the vm module does not allow limiting execution of code.
    * There are some github issue and pull requests out there for this.
    * Note: doesn't actually crash the server.  Probably just overheats it and melts it...
* Removing an object that has children.

### Feature requests

* Tab completion (evan)
* Graphical map (greg)
* Allow verbs to be written in plain javascript (evan)
