const mongoose = require("mongoose");
const ContactsSchema = new mongoose.Schema(
  {
    Contact_id: String,
    name: String,
    user_id: String,
    ContactDetails: Object,
  },
  {
    timestamps: true,
  }
);

const Contacts = mongoose.model("Contacts", ContactsSchema);
exports.Contacts = Contacts;
