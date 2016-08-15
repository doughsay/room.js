function basics() {
  const msg = [
    color.bold.green('GAME BASICS'),
    color.bold.green('==========='),
    '',
    'This game understands basic english sentences of the form:',
    '  [verb] [noun] [preposition] [noun]',
    '',
    'Everything but the [verb] is optional.',
    'Examples:',
    '  #cmd[inventory] (tells you what you are carrying)',
    '  #cmd[go north] (or just "north" or "n")',
    '  #cmd[look] (look around you)',
    '',
    'Experiment with various other verbs to see what works. Good luck!',
    'Since this is a demonstration, if you feel stuck, you may try asking for help',
    'on any object around you, including yourself ("me") or your location ("here").',
    'There might no be a dedicated help topic, but you will be provided a list of',
    'potential commands.',
    'Examples:',
    '  #cmd[help me]',
    '  #cmd[help here]',
    '  #cmd[help chest]',
    '',
    'To read other help topics, type "help topic", or just "? topic".',
    `Topics: ${color.bold.blue('modes')}, ${color.bold.red('programming')}`,
  ];

  return msg.join('\n');
}
