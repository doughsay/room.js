function addExit(exitObject) {
  const sides = this.sides;

  if (this.sides.length >= 2) {
    return false;
  }
  sides.push(exitObject);
  this.sides = sides;
  return true;
}
