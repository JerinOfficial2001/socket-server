const mongoose = require("mongoose");
const WC_GroupSchema = new mongoose.Schema(
  {
    group_name: { type: String, required: true },
    created_by: { type: String, required: true },
    image: Object,
    last_msg: Object,
    unread_msg: Number,
    messages: [
      {
        type: mongoose.Types.ObjectId,
        ref: "WC_grp_message",
      },
    ],
    members: [
      {
        type: mongoose.Types.ObjectId,
        ref: "WC_grp_members",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const WC_Group = mongoose.model("WC_Group", WC_GroupSchema);
exports.WC_Group = WC_Group;
