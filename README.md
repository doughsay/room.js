RoomJS Game Engine
======================

[![Greenkeeper badge](https://badges.greenkeeper.io/doughsay/room.js.svg)](https://greenkeeper.io/) [![Travis](https://img.shields.io/travis/doughsay/room.js.svg)](https://travis-ci.org/doughsay/room.js) [![Code Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://standardjs.com/) [![Codecov](https://img.shields.io/codecov/c/github/doughsay/room.js.svg)](https://codecov.io/gh/doughsay/room.js) [![David](https://img.shields.io/david/doughsay/room.js.svg)](https://david-dm.org/doughsay/room.js) [![David](https://img.shields.io/david/dev/doughsay/room.js.svg)](https://david-dm.org/doughsay/room.js?type=dev)

> **NOTE:** The master branch represents ongoing work and may have the server in a currently unstable state.  Please check the [releases](https://github.com/doughsay/room.js/releases) to get the most recent stable version.

This repository contains the RoomJS game engine (or server).

RoomJS is a modern Node.js-based [MUD](https://en.wikipedia.org/wiki/MUD)/[MOO](https://en.wikipedia.org/wiki/MOO) engine, where (privileged) players can extend everything while in game. The basic idea is that one can create and edit objects, locations and code from inside the game.

The engine includes built-in WebSocket (SocketIO) communication, user account management, flexible command parsing system and persistent on-disk storage.

Prerequisites
=============

The RoomJS server requires **Node.js 6.10** or newer.

Clone the repository or download a ZIP archive.

Installation steps are straightforward:

1. `yarn install`
2. Create a `.env` file to customize the server's configuration. See `.env.development` for examples and explanations.
3. `yarn start`

To interact with the server, you must use a web client application. The standard [client](https://github.com/doughsay/room.js-client) is provided in a separate repository.

Main features
=============

These are but a few of all the things that you get just out-of-the-box:

- Modern **Playing**:
  - Connect and play simply using a web browser. *No need for good old telnet or third-party MUD client.*
  - Fully enjoy the leveraged experience, with colors and clickable links!

- Advanced **Scripting**:
  - Code your game in plain modern JavaScript (ES6), using a nice oriented-object design with inheritable traits, with all scripts running in sandboxes. *No need for proprietary custom programming languages.*
  - Edit your code directly in the browser, using the well-known in-browser code editor [CodeMirror](https://codemirror.net/) with syntax coloring and other neat features. *No need to leave the game in order to add features and hotboot your changes.*

- Flexible On-Disk  **Structure**:
  - All objects are stored in JSON format, in subdirectories along with their attached scripts in JS files: real easy to work with, or to parse for external usage if you ever need to quit the in-browser editing for any reason. *No need for custom file formats, YAML entities or other weird things.*
  - Name and organize your assets logically according to your own needs, without strong restrictions. *No strongly imposed directory structure.*

- Easy **Communication** Channels:
  - Out-of-the box "Say" channel for the chatty ones, "Chat" channel for broadcasting... and "Eval" mode for the developers.
  - Extensible and easily customizable "mode" system.

- Powerfull **Debugging**:
  - The game engine relies on [Bunyan](https://github.com/trentm/node-bunyan), a simple and fast JSON logging library, with a nice CLI for viewing and analyzing logs.

- Lightweight **Demonstration**:
  - The server is bundled with but a small demonstration, to illustrate a few possible ways of coding your own world. *No huge codebase with so many specific combat or leveling rules, or complex skill systems, that one would immediately get lost.*
  - Use it as a base, or wholly replace it, focussing on your own gaming logic!

Demonstration world
===================

Live demonstration: http://roomjs.dose.ninja/

Documentation
=============

And it even comes with documentation...

- [Building and programming your own RoomJS MUD/MOO](doc/PROGRAMMING.md)
- [Organizing and customizing your world objects](doc/CUSTOMIZING.md)
- [A brief description of the demonstration mudlib](doc/DEMO_MUDLIB.md)
