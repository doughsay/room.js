class VerbView
  constructor: (verb) ->
    @oid = verb.oid
    @original_name = verb.name
    @name = ko.observable verb.name
    @hidden = ko.observable verb.hidden
    @dobjarg = ko.observable verb.dobjarg
    @iobjarg = ko.observable verb.iobjarg
    @preparg = ko.observable verb.preparg
    @code = ko.observable verb.code
    @dirty = ko.observable false # TODO dirty needs to apply to ALL properties, not just code

  serialize: ->
    oid: @oid
    original_name: @original_name
    name: @name()
    hidden: @hidden()
    dobjarg: @dobjarg()
    iobjarg: @iobjarg()
    preparg: @preparg()
    code: @code()