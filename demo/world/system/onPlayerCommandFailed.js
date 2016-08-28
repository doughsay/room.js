function onPlayerCommandFailed({ player, dobj, iobj, verbstr, argstr, dobjstr, prepstr, iobjstr }) {
  let msg;
  if (dobj === fail) {
    msg = `I can't see any ${dobjstr}.`;
  } else if (dobj === ambiguous) {
    msg = `I can't tell which ${dobjstr}, maybe use a determiner?`;
  } else if (iobj === fail) {
    msg = `I can't see any ${iobjstr}.`;
  } else if (iobj === ambiguous) {
    msg = `I can't tell which ${iobjstr}, maybe use a determiner?`;
  } else if ((dobj === nothing) && (iobj === nothing)) {
    msg = 'What?';
  } else if (dobj === nothing) {
    msg = `What? Some ${iobj.name} is around, sure...`;
  } else if (iobj === nothing) {
    msg = `What? Some ${dobj.name} is around, sure...`;
  } else {
    msg = 'I didn\'t understand that.';
  }

  player.tell(color.gray(msg));
}
