const mongoose = require("mongoose");

const ChatsSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
});

const Chats = mongoose.model("Chats", ChatsSchema);
exports.Chats = Chats;
