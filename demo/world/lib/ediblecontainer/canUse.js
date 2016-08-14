function canUse(agent) {
  if (this.exhausted) {
    agent.tell(`${this.containerObject} is empty.`);
    return false;
  }
  return true;
}