function who({ player }) {
  const onlinePlayers = system.onlinePlayers();
  const msg = [
    color.green('Online:')
  ].concat(onlinePlayers.map(p => p === player ? `${p.name} (you)` : p.name)).join('\n');
  player.tell(msg);
}
