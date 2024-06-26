const express = require("express");
const { UpdateLastMsg } = require("../controller/contacts");

const route = express.Router();

route.put("/lastMsg", UpdateLastMsg);

module.exports = route;

//! not in use
