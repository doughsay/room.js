import worldObjectProxy from './world-object-proxy';
// import world from './world';
import db from './db';
// import { initCron } from './cron';

const world = require('./world');

export default function loadWorld() {
  db.pkgs().forEach((pkg, pkgId) => {
    world[pkgId] = {};
    pkg.forEach(object => {
      world[pkgId][object.id] = worldObjectProxy(object);
    });
  });
  // initCron();
  return world;
}
