import util from './util';

function makeVerb(
  pattern,
  dobjarg = 'none',
  preparg = 'none',
  iobjarg = 'none',
  rawCode,
  name = 'anonymous'
) {
  const objectArgs = ['none', 'any', 'this'];
  const prepArgs = [
    'none',
    'any',
    'with/using',
    'at/to',
    'in front of',
    'in/inside/into',
    'on top of/on/onto/upon',
    'out of/from inside/from',
    'over',
    'through',
    'under/underneath/beneath',
    'behind',
    'beside',
    'for/about',
    'is',
    'as',
    'off/off of',
  ];

  const args = 'player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr';
  const code = rawCode
    || `function ${name}(${args}) {\n  \n}\n`;

  if (!pattern || pattern.constructor.name !== 'String') {
    throw new Error('Pattern must be a non-empty string.');
  }

  if (objectArgs.indexOf(dobjarg) === -1) {
    throw new Error(`Direct object argument must be one of: ${objectArgs.join(', ')}.`);
  }

  if (prepArgs.indexOf(preparg) === -1) {
    throw new Error(`Preposition argument must be one of: ${prepArgs.join(', ')}.`);
  }

  if (objectArgs.indexOf(iobjarg) === -1) {
    throw new Error(`Indirect object argument must be one of: ${objectArgs.join(', ')}.`);
  }

  return util.buildVerb({ pattern, dobjarg, preparg, iobjarg, code });
}

module.exports = makeVerb;
