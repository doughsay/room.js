function oppositeDirection(direction) {
  const directionsMap = {
    north: 'south',
    east: 'west',
    south: 'north',
    west: 'east',
    up: 'down',
    down: 'up',
  };

  return directionsMap[direction];
}
