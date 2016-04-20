import MooDB from './lib/moo-db';

const db = new MooDB('new-db');

const root = {
  pkgId: 'core',
  id: 'root',
  name: 'root Object',
  aliases: [],
  traitIds: [],
  locationId: null,
  properties: {
    myString: { value: 'string' },
    myNumber: { value: 3.14159 },
    myNotANumber: { NaN: true },
    myDate: { date: '2016-04-11T02:34:10.676Z' },
    myRegexp: { regexp: '/foo/gi' },
    myArray: { array: [{ value: 1 }, { value: 'two' }, { object: { 3: { value: 'three' } } }] },
    myObject: { object: { foo: { value: 'bar' } } },
    myReference: { ref: 'core.root' },
  },
};

const foo = {
  pkgId: 'core',
  id: 'foo',
  name: 'foo bar baz',
  aliases: [],
  traitIds: ['core.root'],
  locationId: null,
  properties: {},
};

db.insert(root);
db.insert(foo);
db.saveSync();
