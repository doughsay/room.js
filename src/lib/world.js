function makeSpecialObject(name) {
  const obj = { id: name };

  function makeToString(str) {
    return () => `[object ${str}]`;
  }

  Object.defineProperty(obj, 'toString', {
    enumerable: false,
    value: makeToString(name),
  });
  Object.freeze(obj);

  return obj;
}

const nothing = makeSpecialObject('nothing');
const failed = makeSpecialObject('failed');
const ambiguous = makeSpecialObject('ambiguous');

const match = { nothing, failed, ambiguous }; // the 'match' pkg
const world = { match };

module.exports = world;
