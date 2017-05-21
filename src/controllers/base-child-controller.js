class BaseChildController {
  constructor (parent) {
    this.parent = parent
  }

  emit (...args) { this.parent.emit(...args) }

  get db () { return this.parent.db }
  get userDb () { return this.parent.userDb }
  get world () { return this.parent.world }
  get controllerMap () { return this.parent.controllerMap }
  get logger () { return this.parent.logger }
  get user () { return this.parent.user }
  set user (user) { this.parent.user = user }
  get playerId () { return this.parent.playerId }
  set playerId (playerId) { this.parent.playerId = playerId }
}

module.exports = BaseChildController
