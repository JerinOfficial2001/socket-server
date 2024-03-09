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
route.get("/tokenID", getTokenID);
route.post("/token", addToken);
route.get("/token", getTokenByID);
route.delete("/tokenID", deleteTokenID);

route.delete("/logout", deleteToken);
route.post("/tokenID", addTokenID);
route.post("/getTokenByID", authByTokenID);

module.exports = route;
