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
  
  let command = iobjstr.split(" ");
  
  // Ensure there are enough arguments
  if (command.length < 2) {
    player.tell(`Use ${this.name} to ${command} what?`);
    return;
  }
  
  let cmdargstr = command.splice(1).join(' ');  
  
  switch (command[0]) {
    case "clone":
    case "create":    
      this.cloneAction(player, cmdargstr);
      break;
    case "zap":
    case "destroy":    
      this.zapAction(player, cmdargstr);
      break;
    case "force":
      this.forceAction(player, iobjstr);
      break;
    case "build":
      this.buildAction(player, cmdargstr);
      break;
    default:
      player.tell(`The ${this.name} cannot ${command[0]}.`);
      break;
  }
}
