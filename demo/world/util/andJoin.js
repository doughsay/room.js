function andJoin(things) {
  if (things.length === 0) { return ''; }
  if (things.length === 1) { return things[0]; }
  const start = things.slice(0, things.length - 1).join(', ');
  const end = things[things.length - 1];
  return `${start} and ${end}`;
}
