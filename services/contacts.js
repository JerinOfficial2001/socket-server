const { EventEmitter } = require("ws");
const { JersApp_Auth } = require("../model/users");

exports.getAllcontacts = async (id, senderID) => {
  const user = await JersApp_Auth.findById(id);
  if (!user.contacts) {
    user.contacts = [];
    user.save();
  }
  const ids = userContacts.contacts.map((elem) => elem.toString());
  const userContacts = await user.populate("contacts");

  if (!ids.includes(senderID)) {
    return [];
  } else {
    return userContacts.contacts;
  }
};
