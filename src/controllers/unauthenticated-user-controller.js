const BaseChildController = require('./base-child-controller');
const Pbkdf2 = require('../lib/pbkdf2');
const { boldMagenta, red } = require('../lib/colors');
// const logger = require('../config/logger');

const hasher = new Pbkdf2();

class UnauthenticatedUserController extends BaseChildController {
  onInput(input) {
    const helpMsg = [
      'Available commands:',
      `• ${boldMagenta('login')}  - login to an existing account`,
      `• ${boldMagenta('create')} - create a new account`,
      `• ${boldMagenta('help')}   - show this message`,
    ].join('\n');

    if (input === 'help') {
      this.emit('output', helpMsg);
    } else if (input === 'login') {
      this.onLogin();
    } else if (input === 'create') {
      this.onCreateUser();
    } else {
      this.emit('output', red('Invalid command.'));
    }
  }

  onCreateUser() {
    const inputs = [
      { type: 'text', label: 'create username', name: 'username' },
      { type: 'password', label: 'create password', name: 'password' },
      { type: 'password', label: 'repeat password', name: 'password2' },
    ];

    this.emit('request-input', inputs, ({ username, password, password2 }) => {
      const sanitizedUsername = username.trim();
      const user = this.userDb.findById(sanitizedUsername);

      if (user) {
        this.emit('output', red('Sorry, that username is taken.'));
        return;
      }

      if (password !== password2) {
        this.emit('output', red('Passwords did not match.'));
        return;
      }

      hasher.hashPassword(password, (err, hashedPassword) => {
        if (err) {
          this.emit('output', red('Bad password.'));
          this.logger.warn(err, 'password hash attempt failed');
          return;
        }

        const now = new Date();
        const newUser = {
          id: sanitizedUsername,
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
        };

        this.userDb.insert(newUser);
        this.user = newUser;
        this.emit('login', username);

        this.logger.info({ user: this.user.id }, 'user created');

        this.emit('output', [
          `Welcome ${this.user.id}!`,
          `Type ${boldMagenta('help')} for a list of available commands.`,
        ].join('\n'));
      });
    });
  }

  onLogin() {
    const inputs = [
      { type: 'text', label: 'username', name: 'username' },
      { type: 'password', label: 'password', name: 'password' },
    ];

    this.emit('request-input', inputs, ({ username, password }) => {
      const sanitizedUsername = username.trim();
      const user = this.userDb.findById(sanitizedUsername);

      if (!user) {
        this.emit('output', red('Invalid username or password.'));
        return;
      }

      hasher.checkPassword(password, user.password, (err, isValid) => {
        if (err) {
          this.emit('output', red('Invalid username or password.'));
          this.logger.warn(err, 'password check attempt failed');
          return;
        }

        if (!isValid) {
          this.emit('output', red('Invalid username or password.'));
          return;
        }

        user.lastLoginAt = new Date();
        this.emit('output', [
          `Welcome back ${user.id}!`,
          `Type ${boldMagenta('help')} for a list of available commands.`,
        ].join('\n'));
        this.emit('set-prompt', username);
        this.emit('login', username);
        this.user = user;

        this.logger.info({ user: user.id }, 'user logged in');
      });
    });
  }
}

module.exports = UnauthenticatedUserController;
