function programming() {
  const msg = [
    color.bold.red('PROGRAMMING (WIP)'),
    color.bold.red('================='),
    '',
    'Try: all() in EVAL mode.  Or you can reference any object by its ID directly; e.g. "mailbox".',
    '',
    'Special object methods: .new(newId); .destroy(); .addAlias(newAlias); .rmAlias; .addTrait; .rmTrait',
    '',
    'To edit verbs and functions, use cmd-p (or ctrl-p) to open the fuzzy-search.',
    'Search for a function / verb by name and hit enter to start editing.',
    '',
    'To add a new function: obj.foo = function foo() {}',
    'To add a new verb:     obj.bar = Verb("bar")',
    '',
    'More info to come.',
  ];

  return msg.join('\n');
}
