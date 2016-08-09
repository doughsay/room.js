function changeId(obj, id) {
  // We can't change the ID of an object, but we can make
  // a new object, copy all its properties, and move all
  // its children to the new object, then delete the old one.

  // TODO: no longer correct

  // if ($(id)) { throw new Error('That ID is already taken.'); }
  // const newObj = obj.parent.new({id: id, name: obj.name});
  //
  // // Copy special properties
  // newObj.location = obj.location;
  // obj.contents.forEach((item) => {
  //   item.location = newObj;
  // });
  //
  // // Change inheritence
  // newObj.parent = obj.parent;
  // obj.children.forEach((item) => {
  //   item.parent = newObj;
  // });
  //
  // // Copy all custom properties
  // for (const key in obj) {
  //   if (obj.hasOwnProperty(key) && key !== 'id') {
  //     newObj[key] = obj[key]
  //   }
  // }
  //
  // obj.destroy();
  // return newObj;
}
