function canUse(agent) {
  if (this.exhausted) {
    agent.tell(`The ${this.containerObject} is empty.`);
    return false;
  }
  return true;
}
