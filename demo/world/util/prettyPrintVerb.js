function prettyPrintVerb(v, objstr) {
  /**
   * Given a Verb and a string representing the "this" element, returns
   * a formatted text command. -- Used by the help system for instance.
   */
  let canRun = true;
  const output = [];
  const verbstr = v.pattern.split(' ')[0].replace(/\*/g, ''); /* first possible */

  if (util.oppositeDirection(verbstr)) {
    // Quick hacky test:
    // oppositeDirection returns undefined for non-canonical directions.
    output.push('<directions>');
    canRun = false;
  } else {
    output.push(verbstr);
  }

  if (v.dobjarg !== 'none') {
    if (v.dobjarg === 'this') {
      output.push(objstr);
    } else {
      output.push('<any>');
      canRun = false;
    }
  }

  if (v.preparg !== 'none') {
    if (v.preparg !== 'any') {
      output.push(v.preparg.split('/')[0]); /* first possible */

      if (v.iobjarg !== 'none') {
        if (v.iobjarg === 'this') {
          output.push(objstr);
        } else {
          output.push('<any>');
          canRun = false;
        }
      }
    } else {
      canRun = false;
      if (v.iobjarg === 'any') {
        if (v.dobjarg !== 'any') {
          output.push('<any>');
        }
      } else if (v.iobjarg !== 'none') {
        output.push('<prep>');
        output.push((v.iobjarg === 'this') ? objstr : '<any>');
      }
    }
  }

  const result = output.join(' ');
  return canRun ? `#cmd[${result}]` : color.gray(result);
}
