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

const Nothing = makeSpecialObject('Nothing');
const FailedMatch = makeSpecialObject('FailedMatch');
const AmbiguousMatch = makeSpecialObject('AmbiguousMatch');
const World = { Nothing, FailedMatch, AmbiguousMatch };

export default World;
