const mongoose = require("mongoose");
const WC_MessageSchema = new mongoose.Schema(
  {
    chatID: String,
    sender: String,
    receiver: String,
    message: String,
  },
  {
    timestamps: true,
  }
);
const WC_Message = mongoose.model("WC_Message", WC_MessageSchema);
exports.WC_Message = WC_Message;
