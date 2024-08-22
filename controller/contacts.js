const { JersApp_Contact } = require("../model/contact");
const { JersApp_Auth } = require("../model/users");
const { getAllcontacts } = require("../services/contacts");

exports.AddContacts = async (data) => {
  const { userID, id, msg, contact_id } = data;

  try {
    const user = await JersApp_Auth.findById(userID);
    const senderData = await JersApp_Auth.findById(id);
    const allContacts = await getAllcontacts(userID);
    if (!allContacts || allContacts.length == 0) {
      const createdContact = await JersApp_Contact.create({
        given_name: "",
        user_id: senderData._id,
        creator_id: user._id,
        phone: senderData.mobNum,
        name: senderData.name,
        lastMsg: msg,
      });
      user.contacts.push(createdContact._id);

      if (!user.chats) {
        user.chats = [];
      }
      user.chats.push(createdContact._id);

      await user.save();
      return true;
    } else {
      const contact = allContacts.find((elem) => elem.user_id.toString() == id);

      if (!userID || !contact) return false;
      const chatIds = user.chats.map((elem) => elem.toString());
      if (!chatIds.includes(contact._id.toString())) {
        user.chats.push(contact._id);
        contact.lastMsg = msg;
        contact.save();
        user.save();
        return true;
      } else {
        return false;
      }
    }
  } catch (error) {
    console.log("error at adding contact");
    return false;
  }
};
exports.UpdateLastMsg = async (ID1, ID2, msg) => {
  try {
    if (!ID1 || !ID2) {
      console.log({
        status: "error",
        message: "ID required",
      });
      return;
    }

    const auth1 = await JersApp_Auth.findById(ID1).populate("contacts");
    const auth2 = await JersApp_Auth.findById(ID2).populate("contacts");

    if (!auth1 || !auth2) {
      console.log({
        status: "error",
        message: "One or both users not found",
      });
      return;
    }

    const contact1 = auth1.contacts.find((elem) => elem.user_id == ID2);
    const contact2 = auth2.contacts.find((elem) => elem.user_id == ID1);

    if (!contact1 || !contact2) {
      console.log({
        status: "error",
        message: !contact1 ? "contact1 not found" : "contact2 not found",
      });
      return;
    }

    const UpdatedContact1 = {
      ...contact1.toObject(),
      lastMsg: msg,
    };

    const UpdatedContact2 = {
      ...contact2.toObject(),
      lastMsg: msg,
    };

    const contact1Result = await JersApp_Contact.findByIdAndUpdate(
      contact1._id,
      UpdatedContact1,
      { new: true }
    );
    const contact2Result = await JersApp_Contact.findByIdAndUpdate(
      contact2._id,
      UpdatedContact2,
      { new: true }
    );

    if (contact1Result && contact2Result) {
      console.log({
        status: "ok",
        message: "Last Msg Updated successfully",
      });
    } else {
      console.log({
        status: "error",
        message: "Failed to update one or both contacts",
      });
    }
  } catch (error) {
    console.error({
      status: "error",
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.UpdateMsgCount = async (id, count) => {
  try {
    if (id && count) {
      const contact = await JersApp_Contact.findById(id);
      if (contact) {
        const UpdatedContact = {
          ...contact.toObject(),
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
