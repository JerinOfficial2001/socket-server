const { WC_Contact } = require("../model/contact");
const { WC_Auth } = require("../model/users");

exports.AddContacts = async (data) => {
  const { senderID, id, msg } = data;
  try {
    const userData = await WC_Auth.findById(senderID);
    if (userData) {
      const allContacts = await WC_Contact.find({
        user_id: id,
        Contact_id: userData.mobNum,
      });
      if (allContacts.length == 0) {
        const res = await WC_Contact.create({
          Contact_id: userData.mobNum,
          name: userData.name,
          user_id: id,
          ContactDetails: { _id: senderID, name: userData.name },
          lastMsg: msg,
          msgCount: 1,
        });
        return true;
      } else {
        console.log({ status: "ok", message: "Contact already there" });
        return false;
      }
    } else {
      console.log(res, "added");
      return true;
    }
  } catch (error) {
    console.error("Error: ", error);
  }
};
exports.UpdateLastMsg = async (ID1, ID2, msg) => {
  try {
    if (ID1 && ID2) {
      const contact1 = await WC_Contact.findOne({ user_id: ID1 });
      const contact2 = await WC_Contact.findOne({ user_id: ID2 });
      if (contact1 && contact2) {
        const UpdatedContact1 = {
          Contact_id: contact1.Contact_id,
          name: contact1.name,
          user_id: contact1.user_id,
          ContactDetails: contact1.ContactDetails,
          lastMsg: msg,
        };
        const UpdatedContact2 = {
          Contact_id: contact2.Contact_id,
          name: contact2.name,
          user_id: contact2.user_id,
          ContactDetails: contact2.ContactDetails,
          lastMsg: msg,
        };
        const contact1Result = await WC_Contact.findByIdAndUpdate(
          contact1._id,
          UpdatedContact1
        );
        const contact2Result = await WC_Contact.findByIdAndUpdate(
          contact2._id,
          UpdatedContact2
        );
        if (contact1Result && contact2Result) {
          console.log({
            status: "ok",
            message: "Last Msg Updated successfully",
          });
        } else {
          console.log({
            status: "error",
            message: "failed",
          });
        }
      } else {
        if (!contact1) {
          console.log({
            status: "error",
            message: "contact1 not found",
          });
        } else {
          console.log({
            status: "error",
            message: "contact2 not found",
          });
        }
      }
    } else {
      console.log({
        status: "error",
        message: "ID required",
      });
    }
  } catch (error) {
    console.log({ status: "error", message: "something Went wrong" });
  }
};
exports.UpdateMsgCount = async (ID, count) => {
  try {
    if ((ID.Contact_id || ID.receiverId) && count) {
      const contact = ID.Contact_id
        ? await WC_Contact.findById(ID.Contact_id)
        : await WC_Contact.findOne({ user_id: ID.receiverId });
      if (contact) {
        const UpdatedContact = {
          Contact_id: contact.Contact_id,
          name: contact.name,
          user_id: contact.user_id,
          ContactDetails: contact.ContactDetails,
          lastMsg: contact.lastMsg,
          msgCount: count,
        };
        const contactResult = await WC_Contact.findByIdAndUpdate(
          contact._id,
          UpdatedContact
        );
        if (contactResult) {
          console.log({
            status: "ok",
            message: "MSG count Updated successfully",
          });
        } else {
          console.log({
            status: "error",
            message: "failed",
          });
        }
      } else {
        console.log({
          status: "error",
          message: "contact not found",
        });
      }
    } else {
      console.log({
        status: "error",
        message: "UpdateMsgCount required field missing",
      });
    }
  } catch (error) {
    console.log({ status: "error", message: "something Went wrong" });
  }
};
