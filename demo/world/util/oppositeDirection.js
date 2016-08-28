function oppositeDirection(direction) {
  const directionsMap = {
    north: 'south',
    east: 'west',
    south: 'north',
    west: 'east',
    up: 'down',
    down: 'up',
    northeast: 'southwest',
    northwest: 'southeast',
    southeast: 'northwest',
    southwest: 'northeast',
  };

  return directionsMap[direction];
}
