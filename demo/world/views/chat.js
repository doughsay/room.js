function chat(sender, recipient, msg) {
  const formattedMsg = color.bold.white(msg);
  const label = color.bold.blue('CHAT');
  return `${label}> ${sender.name}: "${formattedMsg}"`;
}
