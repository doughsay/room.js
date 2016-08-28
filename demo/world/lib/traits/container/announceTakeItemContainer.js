function announceTakeItemContainer(sender, recipient, obj) {
  if (sender === recipient) {
    return `You take the ${obj.name} from the ${this.name}.`;
  }
  return `${sender.name} takes some ${obj.name} from the ${this.name}.`;
}
