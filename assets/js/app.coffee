#= require jquery
#= require jquery-ui
#= require jquery-layout
#= require bootstrap
#= require bootbox
#= require knockout
#= require knockout-ace
#= require knockout-modal

#= require view_models/verb
#= require view_models/modal_form
#= require view_models/moo

# on dom ready, create the view model and apply the knockout bindings
$ ->
  ko.applyBindings new MooView $('body'), $('.screen'), $('.command input')