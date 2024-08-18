const mongoose = require("mongoose");
const JersApp_AuthSchema = new mongoose.Schema({
  mobNum: { type: String, unique: true },
  password: String,
  name: String,
  image: { type: Object },
});

const JersApp_Auth = mongoose.model("JersApp_Auth", JersApp_AuthSchema);
exports.JersApp_Auth = JersApp_Auth;
