const fs = require('fs')

class SimpleDB {
  constructor (filename) {
    this.filename = filename
    this._db = {}

    if (fs.existsSync(filename)) {
      this.loadSync()
    }
  }

  loadSync () {
    this._db = JSON.parse(fs.readFileSync(this.filename))
    return true
  }

  saveSync () {
    fs.writeFileSync(this.filename, `${JSON.stringify(this._db, null, '  ')}\n`)
    return true
  }

  insert (object) {
    if (typeof object.id !== 'string') {
      throw new Error('Object must contain a string id property.')
    }
    if (object.id in this._db) {
      throw new Error('An object with that ID already exists.')
    }
    this._db[object.id] = object
    return object
  }

  remove (object) {
    delete this._db[object.id]
  }

  removeById (id) {
    delete this._db[id]
  }

  findById (id) {
    return this._db[id]
  }

  findBy (field, value) {
    return this.all().filter(object => object[field] === value)
  }

  all () {
    return Object.keys(this._db).map(id => this._db[id])
  }

  clear () {
    this.all().forEach(obj => {
      this.remove(obj)
    })
  }
}

module.exports = SimpleDB
