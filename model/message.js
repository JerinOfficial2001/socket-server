const mongoose = require("mongoose");
const JersApp_MessageSchema = new mongoose.Schema(
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
const JersApp_Message = mongoose.model(
  "JersApp_Message",
  JersApp_MessageSchema
);
exports.JersApp_Message = JersApp_Message;
