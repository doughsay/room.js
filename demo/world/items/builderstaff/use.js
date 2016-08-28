function use({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  /**
   * The builderstaff allows easy object creation/destruction/manipulation
   * for non-programmers, with commands such as:
   *   use staff to <action> <arguments>
   *
   * Currently
   * - use staff to clone|create <object>
   * - use staff to zap|destroy <object>
   * - use staff to force <object> to <action>
   * - use staff to build <direction>
   * - use staff to name <text>
   * - use staff to desc|describe <text>
   * - use staff to id|identify <object>|here|me
   */
  // Staff must be in hands
  if (this.location !== player) {
    player.tell(`You must have the ${this.name} in hands.`);
    return;
  }

  // Ensure indirect object is defined
  if (iobjstr === undefined) {
    player.tell(`Use ${this.name} to what?`);
    return;
  }

  let command = iobjstr.split(' ');

  // Ensure there are enough arguments
  if (command.length < 2) {
    player.tell(`Use ${this.name} to ${command} what?`);
    return;
  }

  const cmdargstr = command.splice(1).join(' ');
  command = command[0];

  switch (command) {
    case 'clone':
    case 'create':
      this.cloneAction(player, cmdargstr);
      break;
    case 'zap':
    case 'destroy':
      this.zapAction(player, cmdargstr);
      break;
    case 'force':
      this.forceAction(player, iobjstr);
      break;
    case 'build':
      this.buildAction(player, cmdargstr);
      break;
    case 'name':
      this.nameAction(player, cmdargstr, false);
      break;
    case 'describe':
    case 'desc':
      this.nameAction(player, cmdargstr, true);
      break;
    case 'id':
    case 'identify':
      this.identifyAction(player, cmdargstr);
      break;
    default:
      player.tell(`The ${this.name} cannot ${command}.`);
      player.tell(color.gray(`Available powers:
  - use staff to create <object> (clones an object)
  - use staff to destroy <object> (destroys a cloned object)
  - use staff to force <object> to <action> (makes someone perform an action)
  - use staff to build <direction> (builds a room in the given direction)
  - use staff to name <text> (names a room built with the staff)
  - use staff to desc|describe <text> (describes a room built with the staff)
  - use staff to id|identify <object>|here|me (obtains the internal ID)
`));
      break;
  }
}
