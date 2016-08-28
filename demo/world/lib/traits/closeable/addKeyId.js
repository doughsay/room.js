function addKeyId(...args) {
  const keySet = this.keySet;
  const ret = keySet.push(...args);
  this.keySet = keySet;
  return ret;
}
