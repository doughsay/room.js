function modes() {
  const msg = [
    color.bold.blue('MODES'),
    color.bold.blue('====='),
    '',
    'You can cycle between different modes by hitting TAB.',
    '',
    'Modes effectively just prefix whatever you type with another word. The modes are:',
    '* SAY: prefix anything you type with the verb `say`',
    '* CHAT: prefix anything you type with the verb `chat`',
    '* EVAL: prefix anything you type with the verb `eval`',
  ];

  return msg.join('\n');
}
