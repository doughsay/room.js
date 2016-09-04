function delegateCommand(target, input) {
  /**
   * So this is where the magic occurs: how to force an object to execute a text command
   * as it was typed:
   * - parse the string
   * - check for matched objects in the environment
   * - check for matching verb with those objects
   * - if found, just called the Verb on the appropriate object.
   *
   * This is mostly what's the game engine itself does.
   */

  function onRunVerb(command, matchedObjects, matchedVerb) {
    const player = target;
    const dobj = matchedObjects.dobj;
    const iobj = matchedObjects.iobj;
    const verbstr = command.verb;
    const argstr = command.argstr;
    const dobjstr = command.dobjstr;
    const prepstr = command.prepstr;
    const iobjstr = command.iobjstr;

    matchedVerb.this[matchedVerb.verb]({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr });
    return true;
  }

  const command = parse(input);
  const matchedObjects = target.matchObjects(command);
  const matchedVerb = target.matchVerb(command, matchedObjects);

  if (matchedVerb) {
    return onRunVerb(command, matchedObjects, matchedVerb);
  } else if (target.location && target.location.verbMissing) {
    const verbMissing = { verb: 'verbMissing', this: target.location };
    return onRunVerb(command, matchedObjects, verbMissing);
  }
  return false;
}
