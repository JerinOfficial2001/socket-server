const { JersApp_Auth } = require("../model/users");

exports.getAllcontacts = async (id) => {
  const user = await JersApp_Auth.findById(id);
  if (!user.contacts) {
    user.contacts = [];
    user.save();
  }
  const userContacts = await user.populate("contacts");
  return userContacts.contacts;
};
