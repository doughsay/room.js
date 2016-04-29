const BaseChildController = require('./base-child-controller');
const { boldMagenta, boldBlue, red } = require('../lib/colors');

class UserController extends BaseChildController {
  get logger() {
    return this.parent.logger.child({ user: this.user.id });
  }

  onInput(input) {
    if (input === 'help') {
      this.onHelp();
    } else if (input === 'logout') {
      this.onLogout();
    } else if (input === 'create') {
      this.onCreatePlayer();
    } else if (input === 'play') {
      this.onPlay();
    } else {
      this.emit('output', red('Invalid command.'));
    }
  }

  onHelp() {
    this.emit('output', [
      'Available commands:',
      `• ${boldMagenta('logout')} - logout of your account`,
      `• ${boldMagenta('create')} - create a new character`,
      `• ${boldMagenta('play')}   - enter the game`,
      `• ${boldMagenta('help')}   - show this message`,
    ].join('\n'));
  }

  onLogout() {
    this.emit('output', 'Bye!');
    this.emit('set-prompt', '');
    this.logger.info('user logged out');
    this.user = null;
  }

  onCreatePlayer() {
    const inputs = [
      { type: 'text', label: 'player name', name: 'playerName' },
    ];

    this.emit('request-input', inputs, ({ playerName }) => {
      const playerId = this.world.nextId(playerName); // should produce a new unique ID

      if (playerId === '') {
        // if the name produces an invalid ID, let's just call the name invalid.
        this.emit('output', red('Sorry, that name is invalid.'));
        return;
      }

      const playerObj = this.db.findBy('name', playerName)[0];

      if (playerObj) {
        this.emit('output', red('Sorry, a character by that name already exists.'));
        return;
      }

      const newPlayerObj = {
        id: playerId,
        name: playerName,
        aliases: [],
        traitIds: [],
        locationId: null,
        userId: this.user.id,
        properties: {},
      };

      this.db.insert(newPlayerObj);
      this.world.insert(newPlayerObj);
      this.world.runHook('system', 'onPlayerCreated', playerId);

      this.logger.info({ player: playerId }, 'player created');

      this.emit('output', `Character created! To start the game now, type ${boldMagenta('play')}!`);
    });
  }

  onPlay() {
    const players = this.db.findBy('userId', this.user.id);

    if (players.length === 1) {
      this.loginPlayer(players[0].id);
    } else if (players.length > 1) {
      const msg = ['Choose a character to play as:'];
      const inputs = [{ type: 'text', label: 'character', name: 'selection' }];

      players.forEach((p, i) => {
        msg.push(`${i + 1}. ${boldBlue(p.name)}`);
      });

      this.emit('output', msg.join('\n'));
      this.emit('request-input', inputs, ({ selection }) => {
        const n = parseInt(selection, 10);

        const lowerCaseNames = players.map(p => p.name.toLowerCase());
        const i = lowerCaseNames.indexOf(selection.toLowerCase());
        if (!isNaN(n) && n > 0 && n <= players.length) {
          this.loginPlayer(players[n - 1].id);
        } else if (i !== -1) {
          this.loginPlayer(players[i].id);
        } else {
          this.emit('output', red('Invalid selection.'));
          return;
        }
      });
    } else {
      const msg =
        `You have no characters to play as. Create one first with ${boldMagenta('create')}.`;
      this.emit('output', msg);
      return;
    }
  }

  logoutOtherInstance(player) {
    if (this.controllerMap.has(player.id)) {
      const controller = this.controllerMap.get(player.id);
      const msg = `You're playing as ${player.name} from another login session. Quitting...`;
      controller.emit('output', msg);
      controller.emit('set-prompt', controller.user.id);
      controller.playerId = null;
      this.controllerMap.delete(player.id);
    }
  }

  loginPlayer(playerId) {
    const player = this.world.get(playerId);
    this.logoutOtherInstance(player);
    this.emit('output', `Now playing as ${player.name}`);
    this.emit('set-prompt', player.name);
    this.playerId = playerId;
    this.controllerMap.set(player.id, this.parent);
    this.world.runHook('system', 'onPlayerConnected', player.id);
    this.logger.info({ player: playerId }, 'user playing as player');
  }
}

module.exports = UserController;
