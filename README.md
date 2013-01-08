JSmoo (tentative title)
=======================

A MOO written in coffeescript running on node.js.  Read about the original [LambdaMoo](http://en.wikipedia.org/wiki/LambdaMOO).

TODO
----

### Moo functionality

* Better object matching (See first big comment in lib/moo.coffee)
* Better verb matching (See second big comment in lib/moo.coffee)
* Using 'this' as the direct/indirect object argument specifier for verbs doesn't work yet
* Preposition argument specifiers need some work.  Some prepositions are synonymous, e.g. 'with' and 'using' should be interchangable.  "open door with key" / "open door using key"
* There should be a fallback function to catch un-recognized commands, like the 'huh' verb in LambdaMoo.

### Client

* Logging in / creating user
* Client-side editing of the Moo database

### Editing actions

* add moo object (should pull next available ID from somewhere)
* delete moo object (id doesn't get re-used, it's lost forever)
* change parent
* edit name
* edit aliases
* edit properties
* edit verbs