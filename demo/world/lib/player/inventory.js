function inventory({ player }) {
  if (this.contents.length === 0) {
    player.tell(color.bold.magenta('You are empty handed.'));
  } else {
    const output = [color.bold.magenta('You are carrying:')];

    this.contents.forEach(obj => {
      // For robustness, ensure objects have a description method
      if (typeof obj.describe === 'function') {
        output.push(util.capitalize(obj.describe()));
      }
    });

    player.tell(output.join('\n   '));
  }
}
