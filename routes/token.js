const express = require("express");
const {
  getToken,
  addToken,
  getTokenByID,
  authByTokenID,
  deleteToken,
  getTokenID,
  addTokenID,
  deleteTokenID,
} = require("../controllers/token");
const route = express.Router();

route.get("/token", getToken);
route.post("/register", addToken);
route.delete("/register", deleteToken);
route.get("/tokenID", getTokenID);
route.post("/tokenID", addTokenID);
route.delete("/tokenID", deleteTokenID);
route.get("/token", getTokenByID);
route.post("/token", authByTokenID);

module.exports = route;
