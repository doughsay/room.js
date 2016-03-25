import crypto from 'crypto';

function uid(len) {
  return crypto.randomBytes(len).toString('base64').slice(0, len);
}

function serializePasswordData(passwordData) {
  return [
    passwordData.salt,
    passwordData.derivedKey,
    passwordData.derivedKeyLength,
    passwordData.iterations,
  ].join('::');
}

function deserializePasswordData(serializedPasswordData) {
  const [salt, derivedKey, derivedKeyLengthStr, iterationsStr] =
    serializedPasswordData.split('::');
  const derivedKeyLength = parseInt(derivedKeyLengthStr, 10);
  const iterations = parseInt(iterationsStr, 10);

  return { salt, derivedKey, derivedKeyLength, iterations };
}

class Pbkdf2 {
  constructor(options = {}) {
    this.iterations = options.iterations || 10000;
    this.saltLength = options.saltLength || 12;
    this.derivedKeyLength = options.derivedKeyLength || 30;
    this.lengthLimit = options.lengthLimit || 4096;
  }

  hashPassword(plaintextPassword, cb) {
    if (plaintextPassword.length >= this.lengthLimit) {
      cb(new Error('password is too long'));
      return;
    }

    const randomSalt = uid(this.saltLength);

    crypto.pbkdf2(
      plaintextPassword,
      randomSalt,
      this.iterations,
      this.derivedKeyLength,
      (err, derivedKey) => {
        if (err) {
          cb(err);
          return;
        }

        cb(null, serializePasswordData({
          salt: randomSalt,
          iterations: this.iterations,
          derivedKeyLength: this.derivedKeyLength,
          derivedKey: new Buffer(derivedKey, 'binary').toString('base64'),
        }));
      }
    );
  }

  checkPassword(plaintextPassword, serializedPasswordData, cb) {
    if (plaintextPassword.length >= this.lengthLimit) {
      cb(new Error('password is too long'));
      return;
    }

    const { salt, derivedKey, derivedKeyLength, iterations } =
      deserializePasswordData(serializedPasswordData);

    if ((!salt) || (!derivedKey) || (!iterations) || (!derivedKeyLength)) {
      cb(new Error("serializedPasswordData doesn't have the right format"));
      return;
    }

    crypto.pbkdf2(
      plaintextPassword,
      salt,
      iterations,
      derivedKeyLength,
      (err, candidateDerivedKey) => {
        if (err) {
          cb(err);
          return;
        }

        if (new Buffer(candidateDerivedKey, 'binary').toString('base64') === derivedKey) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      }
    );
  }
}

export default Pbkdf2;
