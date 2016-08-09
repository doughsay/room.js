function colorTest(player) {
  const colors = [null, 'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  const capitalize = str => str[0].toUpperCase() + str.slice(1);

  const buildLine = (fg, bold) =>
    colors.map(bg => {
      let colorFunc = bold ? color.bold : color.reset;
      if (fg) { colorFunc = colorFunc[fg]; }
      if (bg) { colorFunc = colorFunc[`bg${capitalize(bg)}`]; }
      return colorFunc(' gYw ');
    }).join(' ');

  const outputLines = [' COLORTEST '];

  colors.forEach(fg => {
    outputLines.push(buildLine(fg, false));
    outputLines.push(buildLine(fg, true));
  });

  player.tell(outputLines.join('\n'));
}
