// this creates an object graph with prototypal inheritence
// based on the world objects in the db.

import worldObjectProxy from './world-object-proxy';
import World from './world';
import db from './db';
import { initCron } from './cron';

function loadDescendentsOf(parentId) {
  let objects = db.findBy('parentId', parentId);

  if (!parentId && objects.length === 0) {
    // No objects in the DB!  Let's create at least an empty Root object.
    const Root = {
      id: 'Root',
      name: 'Root',
      type: 'WorldObject',
      aliases: [],
      properties: [],
      verbs: [],
      createdAt: new Date(),
    };
    db.insert(Root);
    objects = [Root];
  }

  objects.forEach((object) => load(object)); // eslint-disable-line no-use-before-define
}

function load(object) {
  World[object.id] = worldObjectProxy(object);
  loadDescendentsOf(object.id);
}

export default function loadWorld() {
  loadDescendentsOf();
  initCron();
  return World;
}
