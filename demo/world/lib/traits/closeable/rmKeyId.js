function rmKeyId(...args) {
  this.keySet = this.keySet.filter(a => args.indexOf(a) === -1);
  return this.keySet.length;
}
