const express = require("express");
const {
  getContacts,
  addContacts,
  deleteContacts,
} = require("../controllers/contacts");
const route = express.Router();

route.get("/contact", getContacts);
route.post("/contact", addContacts);
route.delete("/contact", deleteContacts);

module.exports = route;
