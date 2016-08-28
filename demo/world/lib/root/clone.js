function clone(id) {
  // Convenience utility for copying also the name, description and aliases
  // - for purely identical objects.
  const created = this.new(nextId(id));
  created.name = this.name;
  created.description = this.description;
  this.aliases.forEach(alias => {
    created.addAlias(alias);
  });

  return created;
}
