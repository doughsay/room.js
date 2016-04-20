const callbacks = [];

process.on('cleanup', () => { callbacks.forEach(callback => { callback(); }); });
process.on('exit', () => { process.emit('cleanup'); });
process.on('SIGINT', () => { process.exit(2); });
process.on('SIGTERM', () => { process.exit(0); });
process.on('uncaughtException', err => {
  callbacks.push(() => { throw err; });
  process.exit(99);
});

module.exports = callback => { callbacks.push(callback); };
