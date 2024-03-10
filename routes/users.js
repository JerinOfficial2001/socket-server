const express = require("express");
const {
  getUsers,
  register,
  userData,
  login,
  logout,
} = require("../controllers/users");
const router = express.Router();

router.get("/getUsers", getUsers);
router.post("/register", register);
router.post("/login", login);
router.get("/login", userData);
router.post("/logout", logout);

module.exports = router;
