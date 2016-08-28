function normalizeDirection(str) {
  if (str === '') { return null; }

  if (str === 'ne') { return 'northeast'; }
  if (str === 'se') { return 'southeast'; }
  if (str === 'nw') { return 'northwest'; }
  if (str === 'sw') { return 'southwest'; }

  if ('north'.startsWith(str)) { return 'north'; }
  if ('east'.startsWith(str)) { return 'east'; }
  if ('south'.startsWith(str)) { return 'south'; }
  if ('west'.startsWith(str)) { return 'west'; }
  if ('up'.startsWith(str)) { return 'up'; }
  if ('down'.startsWith(str)) { return 'down'; }

  if ('northeast'.startsWith(str)) { return 'northeast'; }
  if ('southeast'.startsWith(str)) { return 'southeast'; }
  if ('northwest'.startsWith(str)) { return 'northwest'; }
  if ('southwest'.startsWith(str)) { return 'southwest'; }

  return str;
}
