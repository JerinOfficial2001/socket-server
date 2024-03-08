const express = require("express");
const { getAllMessage, deleteMsgs } = require("../controllers/message");
const route = express.Router();

route.get("/message", getAllMessage);
route.delete("/message", deleteMsgs);

module.exports = route;
