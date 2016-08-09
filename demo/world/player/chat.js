function chat({ player, argstr: message }) {
  system.broadcast(views.chat, player, message);
}
