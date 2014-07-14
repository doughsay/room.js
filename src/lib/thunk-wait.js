'use strict';
function wait(ms) {
  return function(cb) { setTimeout(cb, ms) }
}

module.exports = wait
