function announce(viewFn = views.noOp, sender, msg) {
  const locations = [ this ].concat(this.sides);
  
  locations.forEach(side => { 
    side.contents.forEach(recipient => {
      recipient.tell(viewFn(sender, recipient, msg));
    });
  });
}