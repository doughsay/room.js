function delegateCommand(player, target, command) {
  /**
   * Attempts having the target process the command
   */
  const matchedObjects = target.matchObjects(command);
  const matchedVerb = target.matchVerb(command, matchedObjects);

  if (matchedVerb) {
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
  return false;
}
