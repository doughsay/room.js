function onExamine(player) {
  player.tell(`Feeling observed, the ${this.name} starts ${color.red('panicking')}!`);
  if (this.location) {
    // Pick a random exit
    let exitDirs = Object.keys(this.location.exits);
    let pickedExit = exitDirs[Math.floor(Math.random()*exitDirs.length)];

    // Some name cheating...
    let oldname = this.name;
    this.name = `A panicked ${this.name}`;
    
    // Let's try to escape.
    // We use the simplest way here, by just calling goDirection from lib_room.
    // Another possibly better way would be to delegate a "go <dir>" command, and
    // let the engine match it (i.e. not rely on the actual function name).
    player = this; // We'll be the 'player' for the go command.
    let argstr = pickedExit;
    
    if (this.location.goDirection) {
      this.location.goDirection({ player, argstr });
    }
    
    this.name = oldname;
  }
}