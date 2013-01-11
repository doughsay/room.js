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

Launch the server with:

    coffee server.coffee

Connect to is using a web browser by going to [http://localhost:8888/](http://localhost:8888/).

Programming
-----------

If you are signed in as a programmer, you can evaluate any CoffeeScript code by using the *eval* command (*;* shorthand).

    eval 2 + 2
    -> 4

    ;Math.pow 2, 4
    -> 16

To interact with the DB, use the **db** global var.

    ;db.findById(1).name
    -> 'root'

There's a simple wrapper for looking up objects by their ID.

    ;$(1).name
    -> root

To edit 'verbs' on objects, use the *edit* command (leave off the word 'edit' for shorthand).

    edit #4.get

    or

    #6.swing

TODO
----

### Moo functionality

* Better object matching (See first big comment in lib/moo.coffee)
* Better verb matching (See second big comment in lib/moo.coffee)
* Using 'this' as the direct/indirect object argument specifier for verbs doesn't work yet
* Preposition argument specifiers need some work.  Some prepositions are synonymous, e.g. 'with' and 'using' should be interchangable.  "open door with key" / "open door using key"
* There should be a fallback function to catch un-recognized commands, like the 'huh' verb in LambdaMoo.

### Client

* Creating new users

### Editing actions

* easy wrapper functions for adding and deleting objects and verbs