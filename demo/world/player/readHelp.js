function readHelp({ player, dobjstr }) {
  const topic = dobjstr || 'basics';
  if (topic in help && typeof help[topic] === 'function') {
    player.tell(help[topic]());
  } else {
    player.tell(`Sorry, there's no help topic on ${topic}.`);
  }
}
