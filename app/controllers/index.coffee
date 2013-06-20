module.exports = (app) ->

  app.get '/', (req, res) ->
    res.render 'client/index'

  app.get '/editor', (req, res) ->
    res.render 'editor/index'