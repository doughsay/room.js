const bunyan = require('bunyan');
const BaseChildController = require('./base-child-controller');
const parse = require('../lib/parse');
const { bgRed, gray } = require('../lib/colors');
const wrapString = require('../lib/wrap-string');

class PlayerController extends BaseChildController {
  get logger() {
    return this.parent.logger.child({ user: this.user.id, player: this.playerId });
  }

  onTabKeyPress({ direction }) {
    this.world.runHook(this.playerId, 'onTabKeyPress', direction);
  }

  onInput(input) {
    const player = this.world.get(this.playerId);
    const [hookRan, processedInput] = this.world.runHook(
      'system', 'preprocessCommand', player.id, wrapString(input)
    );
    const command = parse(hookRan ? processedInput : input);

    if (command.verb === 'eval' && player.programmer) {
      this.parent.programmerController.onEval(command.argstr);
    } else if (command.verb === 'quit') {
      this.onQuit(player);
    } else {
      this.runCommand(command, player);
    }
  }

  onDisconnect() {
    this.world.runHook('system', 'onPlayerDisconnected', this.playerId);
    this.controllerMap.delete(this.playerId);
    this.playerId = null;
    this.logger.info('player disconnected');
  }

  onQuit(player) {
    this.world.runHook('system', 'onPlayerDisconnected', player.id);
    this.emit('set-prompt', this.user.id);
    this.emit('output', 'Bye!');
    this.controllerMap.delete(player.id);
    this.logger.info('player quit');
    this.playerId = null;
  }

  runCommand(command, player) {
    try {
      const matchedObjects = player.matchObjects(command);
      const matchedVerb = player.matchVerb(command, matchedObjects);

      if (matchedVerb) {
        this.onRunVerb(command, matchedObjects, matchedVerb);
      } else if (player.location && player.location.verbMissing) {
        const verbMissing = { verb: 'verbMissing', this: player.location };
        this.onRunVerb(command, matchedObjects, verbMissing);
      } else {
        this.emit('output', gray("I didn't understand that."));
      }
    } catch (err) {
      const output = bgRed(
        player.programmer ? this.formatError(err) : 'An internal error occurred.'
      );
      this.emit('output', output);
      this.logger.warn({ err: bunyan.stdSerializers.err(err) }, 'error matching');
    }
  }

  onRunVerb(command, matchedObjects, matchedVerb) {
    const playerId = this.playerId;
    const player = this.world.get(playerId);
    const dobjId = matchedObjects.dobj ? matchedObjects.dobj.id : 'void 0';
    const iobjId = matchedObjects.iobj ? matchedObjects.iobj.id : 'void 0';
    const verbstr = wrapString(command.verb);
    const argstr = wrapString(command.argstr);
    const dobjstr = wrapString(command.dobjstr);
    const prepstr = wrapString(command.prepstr);
    const iobjstr = wrapString(command.iobjstr);

    const argObject = [
      `{ player: ${playerId},`,
      `dobj: ${dobjId},`,
      `iobj: ${iobjId},`,
      `verbstr: ${verbstr},`,
      `argstr: ${argstr},`,
      `dobjstr: ${dobjstr},`,
      `prepstr: ${prepstr},`,
      `iobjstr: ${iobjstr} }`,
    ].join(' ');
    const verbStatement = `${matchedVerb.this.id}[${wrapString(matchedVerb.verb)}]`;
    const code = `${verbStatement}(${argObject})`;
    const filename = `Verb::${matchedVerb.this.id}.${matchedVerb.verb}`;

    this.logger.debug({ code }, 'run verb');

    try {
      this.world.run(code, filename);
    } catch (err) {
      const output = bgRed(
        player.programmer ? this.formatError(err) : 'An internal error occurred.'
      );

      this.emit('output', output);
      this.logger.warn({ err: bunyan.stdSerializers.err(err) }, 'error running verb');
    }
  }

  formatError(err) {
    return err.stack;
  }
}

module.exports = PlayerController;
