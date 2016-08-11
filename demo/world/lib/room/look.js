function look({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  const playersHere = this.contents.filter(obj => obj.player);
  const otherThingsHere = this.contents.filter(obj => !!obj.describe);
  const msg = [color.bold.yellow(this.name), this.describe()];
  
  msg.push(color.bold.magenta('Exits: ') + Object.keys(this.exits).join(', '));
  
  otherThingsHere.forEach(obj => {
    const description = obj.describe();
    if (description) {
      msg.push('   ' + util.capitalize(color.gray(description)));
    }
  });

  playersHere.forEach(plr => {
    if (plr !== player) {
      msg.push(color.cyan(`${plr.name} is here.`));
    }
  });

  player.tell(msg.join('\n'));  
}