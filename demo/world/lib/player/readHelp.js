function readHelp({ player, dobj, dobjstr }) {
  const topic = dobjstr || 'basics';

  // First give precedence to help topics.
  // Then try do see if we can help by suggesting verbs available on the target,
  // i.e. any object but other players.

  if (topic in help && typeof help[topic] === 'function') {
    player.tell(help[topic]());
  } else if (dobj === ambiguous) {
    player.tell(`I can't tell which ${dobjstr} you meant.`);
  } else if ((dobj !== fail) && (dobj !== nothing) && (!dobj.player || dobj === player)) {
    const output = [`Sorry, there's no dedicated help topic on ${topic}.`];
    if (dobj === player.location) {
      output.push('However, there may be commands to try in this place...');
    } else if (dobj === player) {
      output.push('However, there may be commands you could try...');
    } else {
      output.push(`However, there may be commands to try on ${dobj.name}...`);
    }

    dobj.values().forEach(v => {
      if (v && v.verb) {
        output.push('   ' + util.prettyPrintVerb(v, dobjstr));
      }
    });
    player.tell(output.join('\n'));
  } else {
    player.tell(`Sorry, there's no help topic on ${topic}.`);
  }
}
