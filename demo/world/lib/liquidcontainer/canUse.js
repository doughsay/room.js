function canUse(agent) {
  if (this.finished) {
    agent.tell(`${this.containerObject} is empty.`);
    return false;
  }
  return true;
}