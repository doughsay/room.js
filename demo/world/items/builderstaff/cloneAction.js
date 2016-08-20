function cloneAction(player, argstr) {
  // Look for the target object, and handle failure
  let target = this.fetchTarget(player, argstr); 
  if (target === fail) {
    return;
  }
  
  if (target.createdWithStaff) {
    player.tell("The Gods of Creation forbid cloning a clone!");
    return;
  }

  // Announcement in the room 
  if (player.location) {
    player.location.announce(
      (sender, recipient, object) => {
        if (sender === recipient) {
          return `You create a new ${object.name} from thin air.`;
        }
        return `${sender.name} creates a new ${object.name} from thin air.`;
      }, player, target);
  }

  // Now, we can proceed to CREATION
  let idScheme = "instances_" + target.id.split("_").pop();
  let created = target.clone(idScheme);
  
  // Special flag to track objects created with the staff.
  created.createdWithStaff = true; 
  
  // Move object in player inventory
  created.location = player;
}