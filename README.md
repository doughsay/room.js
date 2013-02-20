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

    # Launch the server using the start script
    ./start.sh

Connect to it using a web browser by going to [http://localhost:8888/](http://localhost:8888/).

The provided example db has one user who is also a programmer: username=root, password=p@ssw0rd.

Programming
-----------

If you are signed in as a programmer, you can evaluate any CoffeeScript code by using the `eval` command (backtick '`' in shorthand).

    eval 2 + 2
    -> 4

    `Math.pow 2, 4
    -> 16

Eval Context
------------

The eval context contains these global variables:

* `player` - the object representing you, the player.

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

### `rm(id)`

This removes object `id` from the database.  Warning: this is irreversible.

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

### `crontab`

(Array) {read-only} An array of cron-style jobs registered for this object.

Attributes only on player objects
---------------------------------

### `programmer`

(Boolean) Is this player a programmer?

### `username`

(String) The player's username.

Custom object attributes (Properties)
-------------------------------------

You can add or edit custom properties to objects by accessing them as you would in regular (java|coffee)script:

    $(7).description = 'foo bar baz'

To delete properties, use the `delete` keyword like normal:

    delete $(9).my_prop

Object methods
--------------

Calling methods on objects is simple:

    $object.method(arg1, arg2)

These methods are available on room.js objects:

### `inherits_from(obj)`

Is this object a descendant of `obj`?

### `children()`

Returns an array of all direct children of this object.

### `descendants()`

Returns an array of all descendants of this object.

### `editVerb(verb)`

Load the verb named `verb` of the object into the verb editor.

### `addVerb(verb, dobjarg = 'none', preparg = 'none', iobjarg = 'none')`

Add a new verb to the object called `verb` and load it into the verb editor.  You can optionally specify the argument specifiers as well.

### `create(newName, newAliases = [])`

Creates a child of this object.  The child inherits all of its properties and verbs.

* `newName` - (string) The name of the new object.
* `newAliases` - (array[string]) (optional) The list of aliases for the new object.

### `addJob(spec, verbName, start = false)`

Add a new cron-style job to the object.

* `spec` - (string) A cron-style spec (either 5 or 6 digits).
* `verbName` - (string) The verb of this object to run.
* `start` - (boolean) (optional) Whether or not to start the job after registering it.

### `rmJob(index)`

Removes the job specified by the (0-based) index. Check the `crontab` property of the object to find the index. This also stops the job.

* `index` - (int) The 0-based index representing which job to remove.

### `startJob(index)`

Starts the job specified by the (0-based) index. The job will continue to run indefinitely, even through server restarts.

* `index` - (int) The 0-based index representing which job to start.

### `stopJob(index)`

Stops the job specified by the (0-based) index.

* `index` - (int) The 0-based index representing which job to stop.

### `toString()`

Return the string representation of this object.

Verbs
-----

To edit verbs on objects, use the object methods `addVerb` and `editVerb` described above.

    $thing.editVerb 'examine'

This will load the verb 'examine' of the 'Thing Class' into the verb editor.

To remove verbs from objects, you can just use the `delete` keyword.

    delete $thing.examine

The verb context has different variables available to it.  They are as follows:

* `this` or `@` - the object the verb was called on
* `player` - the player who called the verb
* `dobj` - the direct object, if any, that was specified when calling the verb
* `iobj` - the indirect object, if any, that was specified when calling the verb
* `verb` - the word used when invoking the verb
* `argstr` - the entire string that was specfied not including the verb's name
* `args` - either the words of argstr, or an array of arguments passed when calling a verb from inside another verb
* `dobjstr` - the direct object string
* `prepstr` - the preposition string
* `iobjstr` - the indirect object string

The verb context also has access to the `$` function.

TODO
----

* A better editor (seperate page)

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
    * See here: (https://github.com/joyent/node/pull/4115)[https://github.com/joyent/node/pull/4115]
    * Note: doesn't actually crash the server.  Probably just overheats it and melts it...
* Removing an object that has children.

### Feature requests

* Tab completion (evan)
* Graphical map (greg)
* Allow verbs to be written in plain javascript (evan)
