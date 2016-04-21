const chalk = require('chalk');
const color = new chalk.constructor({ enabled: true });

const boldMagenta = color.bold.magenta;
const boldBlue = color.bold.blue;
const red = color.red;
const bgRed = color.black.bgRed;
const gray = color.gray;

module.exports = { color, boldMagenta, boldBlue, red, bgRed, gray };
