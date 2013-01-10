// Knockout.js binding for Ace code editor
ko.bindingHandlers.ace = {
  init: function(element, valueAccessor) {
    var options = ko.utils.unwrapObservable(valueAccessor());
    var theme = options.theme || 'textmate';
    var mode = options.mode || 'javascript';
    var css = options.css || {};
    var value = options.value;

    var editor = ace.edit(element);
    editor.setTheme("ace/theme/"+theme);
    editor.getSession().setMode("ace/mode/"+mode);

    editor.on('blur', function(e) {
      // on change was screwy, use on blur to update the viewmodel
      value(editor.getValue())
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