const { JersApp_Contact } = require("../model/contact");
const { JersApp_Auth } = require("../model/users");

exports.AddContacts = async (data) => {
  const { senderID, id, msg } = data;
  try {
    const contact = await JersApp_Contact.findById(id);
    const user = await JersApp_Auth.findById(senderID);
    if (!senderID || !contact)
      return { status: "error", message: "UserId or contact undefined" };
    const chatIds = user.chats.map((elem) => elem.toString());
    if (!chatIds.includes(id)) {
      user.chats.push(contact._id);
      user.save();
      return { status: "ok", data: contact };
    } else {
      return {
        status: "error",
        message: "already registered",
        data: contact.user_id,
      };
    }
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.UpdateLastMsg = async (ID1, ID2, msg) => {
  try {
    if (ID1 && ID2) {
      const contact1 = await JersApp_Contact.findOne({ user_id: ID1 });
      const contact2 = await JersApp_Contact.findOne({ user_id: ID2 });
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
        const contact1Result = await JersApp_Contact.findByIdAndUpdate(
          contact1._id,
          UpdatedContact1
        );
        const contact2Result = await JersApp_Contact.findByIdAndUpdate(
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
        ? await JersApp_Contact.findById(ID.Contact_id)
        : await JersApp_Contact.findOne({ user_id: ID.receiverId });
      if (contact) {
        const UpdatedContact = {
          Contact_id: contact.Contact_id,
          name: contact.name,
          user_id: contact.user_id,
          ContactDetails: contact.ContactDetails,
          lastMsg: contact.lastMsg,
          msgCount: count,
        };
        const contactResult = await JersApp_Contact.findByIdAndUpdate(
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
