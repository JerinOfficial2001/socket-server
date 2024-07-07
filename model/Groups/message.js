const mongoose = require("mongoose");
const WC_grp_messageSchema = new mongoose.Schema(
  {
    sender_id: { type: String, required: true },
    group_id: { type: String, required: true },
    msg: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const WC_grp_message = mongoose.model("WC_grp_message", WC_grp_messageSchema);
exports.WC_grp_message = WC_grp_message;
