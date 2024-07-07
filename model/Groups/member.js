const mongoose = require("mongoose");
const WC_grp_membersSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  role: { type: String, required: true },
});

const WC_grp_members = mongoose.model("WC_grp_members", WC_grp_membersSchema);
exports.WC_grp_members = WC_grp_members;
