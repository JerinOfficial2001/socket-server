const mongoose = require("mongoose");
const tokenSchema = new mongoose.Schema({
  tokenID: { type: String, unique: true },
});

const TokenID = mongoose.model("TokenID", tokenSchema);
exports.TokenID = TokenID;
