rack = require 'asset-rack'

conf = require './app'

cwd = process.cwd()

buildAssets = ->

  # static assets in /vendor
  vendor = new rack.StaticAssets
    urlPrefix: '/'
    dirname: "#{cwd}/vendor"

  # static assets in /assets
  assets = new rack.StaticAssets
    urlPrefix: '/'
    dirname: "#{cwd}/assets"

  # less styles for client
  clientStyles = new rack.LessAsset
    url: '/css/client.css'
    filename: "#{cwd}/assets/css/client.less"
    compress: conf.env is 'production'
    paths: ["#{cwd}/assets/css/", "#{cwd}/vendor/css/"]

  # snockets file for client
  clientScripts = new rack.SnocketsAsset
    url: '/js/client.js'
    filename: "#{cwd}/assets/js/client.coffee"
    compress: conf.env is 'production'

  # less styles for editor
  editorStyles = new rack.LessAsset
    url: '/css/editor.css'
    filename: "#{cwd}/assets/css/editor.less"
    compress: conf.env is 'production'
    paths: ["#{cwd}/assets/css/", "#{cwd}/vendor/css/"]

  # snockets file for editor
  editorScripts = new rack.SnocketsAsset
    url: '/js/editor.js'
    filename: "#{cwd}/assets/js/editor.coffee"
    compress: conf.env is 'production'

  # app_top.coffee snockets file for js that needs to load in the header
  top_scripts = new rack.SnocketsAsset
    url: '/js/top.js'
    filename: "#{cwd}/assets/js/top.coffee"
    compress: conf.env is 'production'

  new rack.AssetRack [vendor, assets, clientStyles, clientScripts, editorStyles, editorScripts, top_scripts]

assets = buildAssets()

if conf.env is 'development'
  gaze = require 'gaze'

  gaze ["#{cwd}/vendor/**/{*.js,*.css,*.less}", "#{cwd}/assets/**/{*.coffee,*.less}"], (err) ->
    @on 'all', (event, filepath) ->
      console.log "#{filepath} was #{event}, rebuilding assets."
      assets = buildAssets()

module.exports = ->
  assets.handle.apply assets, arguments