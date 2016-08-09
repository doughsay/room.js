function clone({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  if (dobj !== undefined) {
    let id = nextId(dobj.id);
    let created = dobj.new(id);
    created.location = player;
    created.destroyable = true;
    created.addAlias(id); 
    
    function announce(sender, recipient, object) {
      if (sender === recipient) {
        return `You create a new ${object.name} from thin air.`;
      }
      return `${sender.name} creates a new ${object.name} from thin air.`;
    }

    if (player.location) {
      player.location.announce(announce, player, created);
    }
  } else {
    player.tell("You don't have that.");
  }
}