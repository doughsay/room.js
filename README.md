room.js
=======

A [MOO](http://en.wikipedia.org/wiki/MOO) written in [CoffeeScript](http://coffeescript.org/) running on node.js.

MOO stands for Mud, Object Oriented. One of the original MOOs was [LambdaMoo](http://en.wikipedia.org/wiki/LambdaMOO), developed at Xerox PARC.

The basic idea is to have a MUD which (privileged) players can extend while in game.  You can create and edit objects, locations, and code from inside the MOO.

room.js is different from other MOOs because:

1. It uses plain JavaScript (or a language that compiles to it, such as [CoffeeScript](http://coffeescript.org/)) as the programming language instead of the original MOO language or some other custom language.
2. You connect using a web browser, not a telnet or mud client.
3. You can edit the game code in the browser, using a fairly decent in-browser code editor ([Ace](http://ace.ajax.org/)).

Live Demo
---------

There is a live demo of room.js running at: rjs.infinitymotel.net

All players that sign up are automatically granted programmer privileges; any objects you pick up get dropped back into the main room once you leave. (for demo purposes)

The built-in editor is accessible at: rjs.infinitymotel.net/editor

Running the Server
------------------

If you'd like to run your own copy of the server, follow the below instructions to get started. If you do start running an actual game using this server, please let me know about it so I can come check it out!

The server currently requires version 0.11.3 or higher of node.js (0.10.x works too, but will be missing some security features). It also needs to be run with the --harmony flag to enable ES6 features.

Assuming you already have git and node.js installed:

    # Get the code
    git clone git@github.com:doughsay/room.js.git
    cd room.js

    # Install supporting libraries
    npm install

    # copy the sample config file (edit it if you choose)
    cp app/config/app.sample.coffee app/config/app.coffee

    # Launch the server using npm
    npm start

Connect to it using a web browser by going to [http://localhost:8888/](http://localhost:8888/).

The built-in editor is at [http://localhost:8888/editor](http://localhost:8888/editor).

The provided seed database has one user who is also a programmer: username=root, password=p@ssw0rd.

Further Reading
---------------

There are in depth manuals being written for room.js here:

* [Player's Manual](https://github.com/doughsay/room.js/wiki/Player%27s-Manual)
* [Programmer's Manual](https://github.com/doughsay/room.js/wiki/Programmer%27s-Manual)