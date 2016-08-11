function eatOrDrink({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (verbstr === "eat" && !(this.fooType & this.MEAL)) {
    player.tell("Wouldn't you rather drink it?");
    return;
  }
  
  if (verbstr === "drink" && !(this.foodType & this.DRINK)) {
    player.tell("Wouldn't you rather eat it?");
    return;
  }
  
      
  function announce(sender, recipient, object) {
      return sender === recipient
      ? `You ${verbstr} ${object.name}`
      : `${sender.name} ${verbstr}s ${object.name}`;
    
  }
  
  if (this.canUse(player)) {
    if (player.location) {
      player.location.announce(announce, player, this);
    }
  
    this.doUse(player);
    this.onUsed(player);
  }
}