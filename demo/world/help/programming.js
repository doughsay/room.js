function programming() {
  const msg = [
    color.bold.red('PROGRAMMING'),
    color.bold.red('==========='),
    '',
    'Once you have been given developer privileges (or by default, on the demonstration),',
    'you can use the eval command to prefix code instructions, or preferably cycle to the',
    'EVAL mode.',
    '',
    'You can reference any object by its ID directly; e.g. "items.chest".',
    'Invoke all() to retrieve the list of existing objects.',
    '',
    'You can then use any JavaScript construct to start creating new rooms and objects.',
    'Special object methods: .new(newId); .destroy(); .addAlias(newAlias); .rmAlias; .addTrait; .rmTrait',
    '',
    'To add a new function:',
    '   obj.foo = function foo() {}',
    'To add a new verb (i.e. special functions for command processing):',
    '   obj.bar = Verb("bar")',
    '',
    'Then you can hit Ctrl-p (or Cmd-p) to open the fuzzy-search and look for a function or verb',
    'by name. There you can start editing the function/verb and insert your own code.',
    '',
    'For more details, please refer to the online Programming guide.',
  ];

  return msg.join('\n');
}
