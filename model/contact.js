const mongoose = require("mongoose");
const WC_ContactSchema = new mongoose.Schema(
  {
    Contact_id: String,
    name: String,
    user_id: String,
    ContactDetails: Object,
    lastMsg: Object,
    msgCount: Number,
  },
  {
    timestamps: true,
  }
);

const WC_Contact = mongoose.model("WC_Contact", WC_ContactSchema);
exports.WC_Contact = WC_Contact;
