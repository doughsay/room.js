function basics() {
  const msg = [
    color.bold.green('ROOM.JS BASICS'),
    color.bold.green('=============='),
    '',
    'Room.js understands basic english sentences of the form: [verb] [noun] [preposition] [noun]',
    'Everything but the [verb] is optional',
    'Examples:',
    '  #cmd[look]',
    '  #cmd[open mailbox]',
    '  #cmd[take leaflet from mailbox]',
    '  #cmd[read leaflet]',
    '  #cmd[put leaflet into mailbox]',
    '  #cmd[close mailbox]',
    '',
    'Other important verbs:',
    '  #cmd[inventory] (tells you what you\'re carrying)',
    '  #cmd[go north] (or just "north" or "n")',
    '  #cmd[look] (look around you)',
    '',
    'Experiment with various other verbs to see what works. Good luck!',
    '',
    'To read other help topics, type "help topic", or just "? topic".',
    `Topics: ${color.bold.blue('modes')}, ${color.bold.red('programming')}`,
  ];

  return msg.join('\n');
}
