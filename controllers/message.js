const { Message } = require("../model/message");

exports.getAllMessage = async (req, res, next) => {
  try {
    const response = await Message.find({});
    res.status(200).json({ status: "ok", data: response });
  } catch (error) {
    next("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.deleteMsgs = async (req, res, next) => {
  const { id } = req.query;
  try {
    const result = await Message.findByIdAndDelete(id);
    if (result) {
      res.status(200).json({ status: "ok", message: "deleted" });
    } else {
      res.status(200).json({ status: "ok", message: "No data found" });
    }
  } catch (error) {
    next("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
