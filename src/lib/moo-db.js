import fs from 'fs';
import mkdirp from 'mkdirp';
import remove from 'remove';

export class MooDB {
  constructor(directory) {
    this.directory = directory;
    this._db = new Map();
    // this._locationIdIndex = new Map();
    // this._userIdIndex = new Map();

    if (this.dbDirectoryExists()) {
      this.loadSync();
    }
  }

  dbDirectoryExists() {
    return fs.existsSync(this.directory);
  }

  dirnameFor(object) {
    return `${this.directory}/${object.pkgId}/${object.id}`;
  }

  filenameFor(object) {
    return `${this.dirnameFor(object)}/${object.id}.json`;
  }

  nonCallableProperties(object) {
    return object.properties; // TODO: filter
  }

  serializeObject(object) {
    return JSON.stringify({
      pkgId: object.pkgId,
      id: object.id,
      name: object.name,
      aliases: object.aliases,
      traitIds: object.traitIds,
      locationId: object.locationId,
      userId: object.userId,
      properties: this.nonCallableProperties(object),
    }, null, '  ');
  }

  // index(object) {
  //   if (!this._locationIdIndex.get(object.locationId)) {
  //     this._locationIdIndex.set(object.locationId, []);
  //   }
  //   this._locationIdIndex.get(object.locationId).push(object);
  //
  //   if (!this._userIdIndex.get(object.userId)) {
  //     this._userIdIndex.set(object.userId, []);
  //   }
  //   this._userIdIndex.get(object.userId).push(object);
  // }

  loadObjectSync(pkgId, id) {
    const fileContents = fs.readFileSync(`${this.directory}/${pkgId}/${id}/${id}.json`);
    const object = JSON.parse(fileContents);
    this._db.get(pkgId).set(id, object);
    // this.index(object);
  }

  loadPackageSync(pkgId) {
    this._db.set(pkgId, new Map());
    const ids = fs.readdirSync(`${this.directory}/${pkgId}`);
    ids.forEach(id => { this.loadObjectSync(pkgId, id); });
  }

  loadSync() {
    if (!this.dbDirectoryExists()) {
      console.warn('Tried loading DB but directory does not exist.'); // TODO
      return;
    }

    this._db.clear();
    const pkgIds = fs.readdirSync(this.directory);
    pkgIds.forEach(pkgId => { this.loadPackageSync(pkgId); });
  }

  saveSync() {
    if (this.dbDirectoryExists()) { remove.removeSync(this.directory); }

    this._db.forEach(pkg => {
      pkg.forEach(object => {
        mkdirp.sync(this.dirnameFor(object));

        fs.writeFileSync(this.filenameFor(object), this.serializeObject(object));

        // (object.verbs || []).forEach(verb => {
        //   const filename = `${dir}/${verb.name}.js`;
        //   const verbDef = `// verb: ${verb.pattern}; ${verb.dobjarg}; ${verb.preparg}; ${verb.iobjarg}`;
        //   const code = `${verbDef}\n${verb.code}`;
        //   fs.writeFileSync(filename, code);
        // });
        //
        // (object.properties || []).forEach(property => {
        //   if (property.value && property.value.__function__) {
        //     const filename = `${dir}/${property.key}.js`;
        //     const code = property.value.__function__;
        //     fs.writeFileSync(filename, code);
        //   }
        // });
      });
    });
  }

  insert(object) {
    if (typeof object.id !== 'string') {
      throw new Error('Object must contain a string id property.');
    }
    if (typeof object.pkgId !== 'string') {
      throw new Error('Object must contain a string pkgId property.');
    }
    if (this._db.has(object.pkgId) && this._db.get(object.pkgId).has(object.id)) {
      throw new Error('An object with that pkgId and id already exists.');
    }
    let pkg = this._db.get(object.pkgId);
    if (!pkg) {
      pkg = new Map();
      this._db.set(object.pkgId, pkg);
    }
    pkg.set(object.id, object);
    return object;
  }

  remove({ pkgId, id }) {
    return this._remove(pkgId, id);
  }

  removeById(compositeId) {
    const [pkgId, id] = compositeId.split('.');
    return this._remove(pkgId, id);
  }

  _remove(pkgId, id) {
    const pkg = this._db.get(pkgId);
    if (!pkg) { return false; }
    const removed = pkg.delete(id);
    if (removed && pkg.size === 0) { this._db.delete(pkgId); }
    return removed;
  }

  findById(compositeId) {
    const [pkgId, id] = compositeId.split('.');
    const pkg = this._db.get(pkgId);
    if (!pkg) { return void 0; }
    return pkg.get(id);
  }

  // findBy(field, value) {
  //   return this.all().filter(object => object[field] === value);
  // }

  findBy(pkgId, field, value) {
    const pkg = this._db.get(pkgId);
    if (!pkg) { return []; }
    return [...pkg.values()].filter(object => object[field] === value);
  }

  pkgs() {
    return this._db;
  }
}

export default MooDB;
