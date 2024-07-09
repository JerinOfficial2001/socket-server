const jwt = require("jsonwebtoken");
const { WC_Auth } = require("../model/users");
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;

exports.authenticateByTokenAndUserID = async (token, userid) => {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await WC_Auth.findById(decoded.userId);
    const userID = user ? user._id : null;
    if (!token || !user || userID.toString() !== userid || !userid) {
        return false;
    } else {
        return user;
    }
};