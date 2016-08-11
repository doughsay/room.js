function announceSay(sender, recipient, msg) {
  const formattedMsg = color.bold.white(msg);

  return sender === recipient
    ? `you say "${formattedMsg}"`
    : `${sender.name} says "${formattedMsg}"`;
}
