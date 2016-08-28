function doOpen(agent) {

  function announce(sender, recipient, object) {
    if (sender === recipient) {
      return `You open the ${object.name}.`;
    }
    return `${sender.name} opens some ${object.name}.`;
  }

  if (agent !== undefined && agent.location) {
    agent.location.announce(announce, agent, this);
  }
  this.closed = false;
  this.onOpen(agent);
}
