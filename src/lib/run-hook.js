import vm from 'vm';

import World from './world';
import context from './context';
import util from './util';
import { vmLogger } from './logger';

function hookExists(object, hookName) {
  return World[object] && typeof World[object][hookName] === 'function';
}

// run an event hook if it exists
export default function runHook(...args) {
  const playerId = args.shift();
  const object = args.shift();
  const hook = args.shift();
  const player = playerId ? World[playerId] : void 0;

  if (hookExists(object, hook)) {
    const code = `${object}.${hook}(${args.join(', ')})`;

    vmLogger.debug(code);

    try {
      vm.runInContext(code, context, { filename: `Hook::${object}.${hook}`, timeout: 500 });
    } catch (err) {
      if (player && player.isOnline) {
        util.sendError(player, err);
      } else {
        vmLogger.error(err.toString());
      }
    }
  }
}
