function onExamine(player) {
  player.tell(`Feeling observed, the ${this.name} starts ${color.red('panicking')}!`);
  if (this.location) {
    // Pick a random exit
    const exitDirs = Object.keys(this.location.exits);
    if (exitDirs.length === 0) {
      // Safeguard
      return;
    }
    const pickedExit = exitDirs[Math.floor(Math.random() * exitDirs.length)];

    // Some name cheating...
    const oldname = this.name;
    this.name = `A panicked ${this.name}`;

    // Let's try to escape.
    // We use the simplest way here, by just calling goDirection from lib_room.
    // Another possibly better way would be to delegate a "go <dir>" command, and
    // let the engine match it (i.e. not rely on the actual function name).
    const argstr = pickedExit;

    if (this.location.goDirection) {
      this.location.goDirection({ player: this, argstr });
    }

    this.name = oldname;
  }
}
