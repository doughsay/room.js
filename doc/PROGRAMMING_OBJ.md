# Programming Room.JS - 3. Object serialization

This guide is intended for players with developer privileges in the game.

This chapter documents the in-memory representation for world objects and their on-disk JSON serialization.

What kind of properties can you store and use in world objects? Basically, anything that serializes to JSON, and a few extra things as well, described hereafter.

## 1. Default base properties

First, let's create a test object and study its structure:

```javascript
lib.item.new('items.test')
items.test
```

The in-game world object contains all the default base properties (identifier, name, array of aliases, array of traits, location and contents).

```javascript
{ id: 'items.test',
  name: 'items.test',
  aliases: [],
  traits: [Array(1)],
  location: null,
  contents: [] }
```

Likewise, the on-disk JSON serialization looks as follows:

```javascript
{
  "name": "items.test",
  "aliases": [],
  "traitIds": [
    "lib.item"
  ],
  "locationId": null,
  "properties": {}
}
```

Extra fields, if any, will be serialized into the "properties" object.

## 2. Numbers, strings and booleans

Numbers, strings and boolean values can be used directly in world objects.

```javascript
items.test.someNumber = 5
items.test.someBoolean = true
items.test.someString = "someText"
```

In-game world object:

```javascript
{ id: 'items.test',
  name: 'items.test',
  aliases: [],
  traits: [Array(1)],
  location: null,
  contents: [],
  someNumber: 5,
  someString: 'someText',
  someBoolean: true }
```

On-disk serialization:

```javascript
{
  "name": "items.test",
  ...
  "properties": {
    "someNumber": {
      "value": 5
    },
    "someString": {
      "value": "someText"
    },
    "someBoolean": {
      "value": true
    }
  }
}
```

## 3. Dates and regular expressions


```javascript
items.test.someDate = new Date()
items.test.someRegexp = /abc/i
```

In-game world object:

```javascript
{ id: 'items.test',
  name: 'items.test',
  ...
  someDate: Mon Aug 14 2017 14:47:09 GMT+0200,
  someRegexp: /abc/i }
```

On-disk serialization:

```javascript
{
  "name": "items.test",
  ...
  "properties": {
    ...
    "someDate": {
      "date": "2017-08-14T12:47:09.423Z"
    },
    "someRegexp": {
      "regexp": "abc",
      "flags": "i"
    }
  }
}
```

## 4. Arrays and objects

```javascript
items.test.someArray = [1, 2, 3]
items.test.someObject = { a: 1, b: false }
```

In-game world object:

```javascript
{ id: 'items.test',
  name: 'items.test',
  ...
  someArray: [Array(3)],
  someObject: [object Object] }
}
```

On-disk serialization:

```javascript
{
  "name": "items.test",
  ...
  "properties": {
    ...
    "someArray": {
      "array": [
        {
          "value": 1
        },
        {
          "value": 2
        },
        {
          "value": 3
        }
      ]
    },
    "someObject": {
      "object": {
        "a": {
          "value": 1
        },
        "b": {
          "value": false
        }
      }
    }
  }
}
```

## 5. World object references

Existing world objects used in fields are serialized by reference (using their identifier):

```javascript
items.test.someRef = players.joe
// Assuming there's a player object named 'joe'
```

In-game world object:

```javascript
{ id: 'items.test',
  name: 'items.test',
  ...
  someRef: [object players.joe] }
```

On-disk serialization:

```javascript
{
  "name": "items.test",
  ...
  "properties": {
    ...
    "someRef": {
      "ref": "players.joe"
    }
  }
}
```

## 6. Functions and verbs

Functions and verbs (as a special type of functions) have their contents saved in a separate file (with extension .js) alongside the JSON-serialized object.

```javascript
items.test.someFunc = function someFunc() {}
items.test.someVerb = Verb("someVerb", "this", "none", "none")
```

In-game world object:

```javascript
{ id: 'items.test',
  name: 'items.test',
  ...
  someFunc: [Function],
  someVerb: [Verb someVerb(this, none, none)] }
```

On-disk serialization:

```javascript
{
  "name": "items.test",
  ...
  "properties": {
    ...
    "someFunc": {
      "file": "someFunc.js",
      "function": true
    }
    "someVerb": {
      "file": "someVerb.js",
      "verb": true,
      "pattern": "someVerb",
      "dobjarg": "this",
      "preparg": "none",
      "iobjarg": "none"
    }
  }
}
```

## 7. String objects

String objects (created with `new String()`) also have their contents saved in a separate file (with extension .txt) alongside the JSON-serialized object.

String objects can therefore be used to store long strings, that are best kept separate outside the main object.
Please remembler, nevertheless, that String objects in ECMAScript do not exactly behave as regular strings (e.g. for comparison, etc.).

```javascript
items.test.someExtString = new String("Some long string")
```

In-game world object:

```javascript
{ id: 'items.test',
  name: 'items.test',
  ...
  someExtString: [String] }
```

On-disk serialization:

```javascript
{
  "name": "items.test",
  ...
  "properties": {
    ...
    "someExtString": {
      "file": "someExtString.txt",
      "text": true
    }
  }
}
```

Back to the [summary](PROGRAMMING.md)