// Knockout.js binding for Ace code editor
ko.bindingHandlers.ace = {
  init: function(element, valueAccessor) {
    var options = ko.utils.unwrapObservable(valueAccessor());
    var theme = options.theme || 'textmate';
    var mode = options.mode || 'javascript';
    var css = options.css || {};
    var value = options.value;
    var dirty = options.dirty;

    var editor = ace.edit(element);
    editor.setTheme("ace/theme/"+theme);
    editor.getSession().setMode("ace/mode/"+mode);

    // emulate onchange event, because ace does it weirdly
    // also keep track of a dirty flag
    var originalValue = value();
    var lastValue = value();
    editor.on('blur', function(e) {
      var newValue = editor.getValue();
      if(newValue !== lastValue) {
        // changed!
        value(newValue);
        lastValue = newValue;
      }
      dirty(newValue !== originalValue);
    });

    // set up dom node disposal callback, for when knockout removes element
    ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
        editor.destroy();
    });

    // apply any styling that was declared in the binding
    $(element).css(css)
  },
  update: function(element, valueAccessor) {
    var options = ko.utils.unwrapObservable(valueAccessor());
    var value = options.value;

    var editor = ace.edit(element);

    editor.setValue(value(), -1);
  }
}