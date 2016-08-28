function describe() {
  if (this.description) {
    return this.description;
  }
  // Fallback to short name
  return this.name;
}
