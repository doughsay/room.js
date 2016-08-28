function matchableObjects() {
  let objs = [];

  if (!this.closed) {
    this.contents.forEach(obj => {
      objs.push(obj);
      if (typeof obj.matchableObjects === 'function') {
        objs = objs.concat(obj.matchableObjects());
      }
    });
  }

  return objs;
}
