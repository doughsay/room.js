# Programming Room.JS - 1. Introduction and example

## Introduction

This guide is intended for players with developer privileges in the game.

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
    - To add a new function: `obj.foo = function foo() {}`
    - To add a new verb: `obj.bar = Verb("bar")`
    - In the web client, to edit verbs and functions, use **Ctrl-p** (or **Cmd-p**) to open the fuzzy-search. Search for a function or verb by name and hit enter to start editing.
- Verbs: these are special functions invoked when a corresponding command from the player has succesfully been parsed.
- Traits: the object-oriented programming in Room.JS relies on traits. Any world object can be used as a trait in other objects, and can have several traits. This is how an object can be used to extend the functionality of another object.

## Example

For now, let's create our first object: a (very) basic lantern!
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
- Close the editing tabs and return to the game tab. Here, for the sake of illustration, we decided to use two additional functions, that will be responsible for changing the state flag and announce something to other people in the room. So let's first create them:
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
- Go back to the game tab. We will want to test our new object, so let's bring it to our current room (and notice how the *this* object conveniently here points to you, the player/builder):
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

Next topic: [Reference guide](PROGRAMMING_REF.md)

Back to the [summary](PROGRAMMING.md)
