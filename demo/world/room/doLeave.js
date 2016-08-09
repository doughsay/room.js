function doLeave(agent, direction) {
  agent.location.announce(this.announceLeaveRoom, agent, direction);
  this.onLeave(agent);
}