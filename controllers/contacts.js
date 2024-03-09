const { Chats } = require("../model/chats");
const { Contacts } = require("../model/contacts");
const { Message } = require("../model/message");

exports.addContacts = async (req, res, next) => {
  try {
    const allContacts = await Contacts.find({
      user_id: req.body.user_id,
      Contact_id: req.body.Contact_id,
    });
    if (allContacts.length == 0) {
      const response = await Contacts.create(req.body);
      res.status(200).json({ status: "ok", data: response });
    } else {
      res.status(200).json({
        status: "error",
        message: "already registered",
        data: allContacts[0]._id,
      });
    }
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.getContacts = async (req, res, next) => {
  const { user_id } = req.query;
  try {
    const allContacts = await Contacts.find({});
    const filteredData = allContacts.filter(
      (contact) => contact.user_id == user_id
    );
    if (filteredData) {
      return res.status(200).json({ status: "ok", data: filteredData });
    } else {
      return res.status(200).json({ status: "ok", data: [] });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.deleteContacts = async (req, res, next) => {
  const { sender_id, receiver_id, Contact_id } = req.query;
  try {
    const result = await Contacts.findOne({ Contact_id });

    if (result) {
      const response = await Chats.find({});
      const chatIDs = [sender_id, receiver_id];

      const filteredChats = response.find((i) =>
        chatIDs.every((id) => i.sender == id || i.receiver == id)
      );
      if (filteredChats) {
        const msgObj = await Message.find({ chatID: filteredChats._id });
        if (msgObj) {
          const deletedContactObj = await Contacts.findByIdAndDelete(
            result._id
          );
          if (deletedContactObj) {
            const deletedChat = await Chats.findByIdAndDelete(
              filteredChats._id
            );
            if (deletedChat) {
              const deletedMsg = await Message.deleteMany({
                chatID: filteredChats._id,
              });

              if (deletedMsg) {
                res.status(200).json({
                  status: "ok",
                  message: "Contact & chat & Msg Deleted",
                });
              } else {
                res
                  .status(200)
                  .json({ status: "ok", message: "Msg not Deleted" });
              }
            } else {
              res
                .status(200)
                .json({ status: "ok", message: "chat not Deleted" });
            }
          } else {
            res.status(200).json({ status: "ok", message: "NotDeleted" });
          }
        } else {
          const deletedContactObj = await Contacts.findByIdAndDelete(
            receiver_id
          );
          if (deletedContactObj) {
            const deletedChat = await Chats.findByIdAndDelete(
              filteredChats._id
            );
            if (deletedChat) {
              res
                .status(200)
                .json({ status: "ok", message: "Contact & chat Deleted" });
            } else {
              res
                .status(200)
                .json({ status: "ok", message: "chat not Deleted" });
            }
          } else {
            res.status(200).json({ status: "ok", message: "NotDeleted" });
          }
        }
      } else {
        const deletedContactObj = await Contacts.findByIdAndDelete(result._id);
        if (deletedContactObj) {
          res.status(200).json({ status: "ok", message: "Contact Deleted" });
        } else {
          res.send({ status: "error", message: "Contact not deleted" });
        }
      }
    } else {
      res.status(200).json({ status: "ok", message: "failed" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};