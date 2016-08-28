function onlinePlayers() {
  return players().filter(p => p.online);
}
