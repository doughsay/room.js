function renderPrompt() {
  const parts = [this.name];
  if (this.mode.promptString) {
    parts.push(this.mode.promptString);
  }
  this.setPrompt(parts.join(' '));
}
