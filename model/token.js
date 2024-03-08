const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  token: { type: String, unique: true },
});

const Token = mongoose.model("Token", tokenSchema);
exports.Token = Token;
