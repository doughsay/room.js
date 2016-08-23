function eatOrDrink({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (verbstr === "eat" && !(this.foodType & this.MEAL)) {
    player.tell("Wouldn't you rather drink it?");
    return;
  }
  
  if (verbstr === "drink" && !(this.foodType & this.DRINK)) {
    player.tell("Wouldn't you rather eat it?");
    return;
  }
  
      
  function announce(sender, recipient, object) {
      return sender === recipient
      ? `You ${verbstr} the ${object.name}.`
      : `${sender.name} ${verbstr}s some ${object.name}.`;
    
  }
  
  if (this.canUse(player)) {
    if (player.location) {
      player.location.announce(announce, player, this);
    }
  
    if (this.doUse) {
      this.doUse(player);
    }
    this.onUse(player);
    
    if (this.destroyOnUse) {
     this.destroy();
    }
  }
}
