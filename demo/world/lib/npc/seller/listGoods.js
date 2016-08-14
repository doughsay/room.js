function list({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  let output = [`${this.name} says: "Greetings ${player.name}! Here are the available goods."`];
  this.contents.forEach(obj => {
    output.push('  - ' + color.gray(obj.name));
  });
  
  player.tell(output.join('\n'));
}
