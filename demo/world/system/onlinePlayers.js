function onlinePlayers() {
  return allPlayers().filter(p => p.online);
}
