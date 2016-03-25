// parse a command string into a command object:
// e.g.

// "put book on table" ->
//   verb: 'put'
//   do:   'book'
//   prep: 'on'
//   io:   'table'

// "look" ->
//   verb: 'look'
//   do:   null
//   prep: null
//   io:   null

// "take yellow bird" ->
//   verb: 'take'
//   do:   'yellow bird'
//   prep: null
//   io:   null

// "put yellow bird in cuckoo clock" ->
//   verb: 'put'
//   do:   'yellow bird'
//   prep: 'in'
//   io:   'cuckoo clock'

// warning: prepositions containing other prepositions as
// substrings (using word boundaries) must precede them.
// e.g. 'on top of' comes before 'on', but 'onto' doesn't have to precede 'on'.

// translated from coffeescript, so it might be a little weird.

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

const prepex = new RegExp(`\\b(${prepositions.join('|')})\\b`);

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

  if (search === null) {
    return [false];
  }

  const prepstr = search[0];
  const i = search.index;
  const dobjstr = i === 0 ? void 0 : text.slice(0, i - 1);
  let iobjstr = text.slice(i + prepstr.length + 1);

  if (iobjstr === '') {
    iobjstr = void 0;
  }

  return [true, [dobjstr, prepstr, iobjstr]];
}

export default function parseCommand(text) {
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
