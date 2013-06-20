express = require 'express'
connect = require 'connect'

conf = require './app'
assets = require './assets'

cwd = process.cwd()

module.exports = (app) ->

  app.configure ->
    app.set 'env', conf.env
    app.set 'port', if conf.socket? then conf.socket else conf.port
    app.set 'views', "#{cwd}/app/views"
    app.set 'view engine', 'jade'

    app.use express.logger('short')
    app.use connect.compress()
    app.use express.favicon "#{cwd}/assets/img/favicon.ico"
    app.use assets
    app.use app.router

  app.configure 'development', ->
    app.use express.errorHandler dumpExceptions: true, showStack: true

  app.configure 'production', ->
    app.use express.errorHandler()

    # set up 404 routes
    app.use (req, res) ->
      res.status 404

      # respond with html page
      if req.accepts 'html'
        res.render 'errors/404', { url: req.url }
        return

      # respond with json
      if req.accepts 'json'
        res.send { error: '404 Not found', url: req.url }
        return

      # default to plain-text. send()
      res.type('txt')
        .send "404 Not found.\nThe requested URL '#{req.url}' was not found on this server."