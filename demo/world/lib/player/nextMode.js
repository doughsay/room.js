function nextMode(direction) {
  let ms = modes_modes.all;
  if (direction === -1) { ms.reverse(); }
  const currentIdx = ms.indexOf(this.mode);
  ms = ms.slice(currentIdx + 1).concat(ms.slice(0, currentIdx));
  let nm = ms.find(mode => mode.allowedFor(this));
  if (!nm) { nm = this.mode; }
  return nm;
}
