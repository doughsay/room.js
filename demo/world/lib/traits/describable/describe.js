function describe() {
  if (this.description) {
    return this.description;
  }
  // Fallback on short name
  return this.name;
}
