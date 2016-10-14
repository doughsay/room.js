// Language parser.
//
// 1. The sentence parser understands basic english command strings of the form:
//    '[verb] [direct object] [preposition] [indirect object]'
// Where prepositions are matched against a pre-defined list.
//
// Examples:
// "put book on table" ->
//   verb: 'put'
//   dobj: 'book'
//   prep: 'on'
//   iobj: 'table'
//
// "look" ->
//   verb: 'look'
//   dobj: null
//   prep: null
//   iobj: null
//
// "take yellow bird" ->
//   verb: 'take'
//   dobj: 'yellow bird'
//   prep: null
//   iobj: null
//
// "put yellow bird in cuckoo clock" ->
//   verb: 'put'
//   dobj: 'yellow bird'
//   prep: 'in'
//   iobj: 'cuckoo clock'
//
// 2. The noun parser understands basic nominal groups with optional determiners,
// of the form
//      '[determiner] [noun]' or '[ordinal].[noun]' or '[noun].[ordinal]' or '[noun] [ordinal]'
// With either a determiner is matched against a pre-defined list and categorized,
// or an ordinal number value is provided (= rank in a collection).
//
// Examples:
// "yellow bird.2" = "yellow bird 2" = "2.yellow bird" ->
//   det = '2'
//   noun = 'yellow bird'
//
// "a yellow bird" = "any yellow bird" ->
//   det = 'any'
//   noun = 'yellow bird'
//
// "yellow bird" = "the yellow bird" ->
//   det = undefined
//   noun = 'yellow bird'
// (i.e. absence of determiner is assumed to imply definiteness)
//
// warning: prepositions containing other prepositions as
// substrings (using word boundaries) must precede them.
// e.g. 'on top of' comes before 'on', but 'onto' doesn't have to precede 'on'.

const prepositions = [
  'with', 'using',
  'at', 'to',
  'in front of',
  'in', 'inside', 'into',
  'on top of', 'on', 'onto', 'upon',
  'out of', 'from inside', 'from',
  'over',
  'through',
  'under', 'underneath', 'beneath',
  'behind',
  'beside',
  'for', 'about',
  'is',
  'as',
  'off of', 'off',
];

const determiners = {
  all: 'all',
  the: undefined, // assume definite is same as no determiner
  any: 'any',
  a: 'any',
  an: 'any',
};

const prepex = new RegExp(`\\b(${prepositions.join('|')})\\b`);
const qualex = new RegExp(
  `^(${Object.keys(determiners).join('|')})\\b|^([1-9][0-9]{0,1})\\.|[\\s\\.]([1-9][0-9]{0,1})$`
);

function sanitize(text) {
  return text.trim().replace(/\s+/g, ' ');
}

// return [first_word, rest]
function chomp(s) {
  const i = s.indexOf(' ');
  return (i !== -1) ? [s.slice(0, i), s.slice(i + 1)] : [s, ''];
}

function parsePreposition(text) {
  const search = text.match(prepex);
  if (search === null) { return [false]; }

  const prepstr = search[0];
  const i = search.index;
  const dobjstr = i === 0 ? undefined : text.slice(0, i - 1);
  let iobjstr = text.slice(i + prepstr.length + 1);
  if (iobjstr === '') { iobjstr = undefined; }

  return [true, [dobjstr, prepstr, iobjstr]];
}

function parseSentence(text) {
  const [verb, rest] = chomp(sanitize(text));
  const argstr = rest;
  let dobjstr;
  let iobjstr;
  let prepstr;

  if (rest) {
    const [found, parts] = parsePreposition(rest);
    if (found) {
      [dobjstr, prepstr, iobjstr] = parts;
    } else {
      dobjstr = rest;
    }
  }

  return { verb, dobjstr, prepstr, iobjstr, argstr };
}

function parseNoun(text) {
  if (!text) {
    return [undefined, undefined];
  }
  const search = text.match(qualex);
  let nounstr;
  if (search === null) {
    return [undefined, text];
  }

  let detstr = search[1] || search[2] || search[3];
  const i = search.index;

  nounstr = i === 0 ? text.slice(detstr.length + 1) : text.slice(0, i);
  if (nounstr === '') { nounstr = undefined; }
  detstr = {}.hasOwnProperty.call(determiners, detstr) ? determiners[detstr] : detstr;

  return [detstr, nounstr];
}

module.exports = {
  parseSentence,
  parseNoun,
};
