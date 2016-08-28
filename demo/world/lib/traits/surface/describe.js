function describe() {
  let description = this.description ? this.description : this.name;
  if (this.contents.length > 0) {
    return description + '\n' + this.describeContents();
  }
  return description;
}
