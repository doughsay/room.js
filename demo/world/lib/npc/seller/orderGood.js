function order({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (!dobjstr) {
    player.tell(`${this.name} says: "What?"`);
    return;
  }
  
  const target = this.findInside(dobjstr);

  if (target === fail) {
    player.tell(`${this.name} says: "I am sorry, we don't have any ${dobjstr}."`);
  } else if (target === ambiguous) {
    player.tell(`${this.name} says: "I can't tell which ${dobjstr} you meant."`);
  } else {
    player.tell(`${this.name} says: "You are welcome!"`);
    
    // Clone the good and give it to player
    let created = target.clone("instances_" + target.id.split("_").pop());
    created.location = player;
    player.location.announce(this.announceSale.bind(this), player, created);

  } 
}
