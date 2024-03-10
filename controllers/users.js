const { Auth } = require("../model/auth");
const jwt = require("jsonwebtoken");
const { Token } = require("../model/token");
const { TokenID } = require("../model/tokenID");
const SECRET_KEY = process.env.SECRET_KEY;
exports.getUsers = async (req, res, next) => {
  try {
    const allData = await Auth.find({});
    if (allData) {
      res.status(200).json({ status: "ok", data: allData });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.login = async (req, res, next) => {
  try {
    const user = await Auth.findOne({ mobNum: req.body.mobNum });
    if (!user) {
      res.status(200).json({ status: "error", message: "User not found" });
    } else if (user && user.password == req.body.password) {
      const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
        expiresIn: "24h",
      });

      res.status(200).json({ status: "ok", data: { token } });
    } else {
      res.status(401).json({ status: "error", message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
exports.register = async (req, res, next) => {
  try {
    const { mobNum, password, name } = req.body;
    const allData = await Auth.find({});
    const particularData = allData.find((i) => i.mobNum == mobNum);
    if (particularData) {
      res.status(500).json({ status: "error", data: "User Already Exists" });
    } else {
      const response = await Auth.create({
        mobNum,
        password,
        name,
      });
      res.status(200).json({ status: "ok", data: response });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.userData = async (req, res, next) => {
  try {
    // Extract token from the request headers or cookies
    const token = req.headers.authorization?.replace("Bearer ", ""); // Adjust this according to your token handling

    if (!token) {
      return res
        .status(401)
        .json({ status: "error", data: "Unauthorized - Missing Token" });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, SECRET_KEY);

    // Retrieve user data based on the decoded information
    const user = await Auth.findById(decoded.userId);

    if (user) {
      res.status(200).json({ status: "ok", data: { user } });
    } else {
      res.status(404).json({ status: "error", data: "User not found" });
    }
  } catch (error) {
    console.error("Error:", error);
    res
      .status(401)
      .json({ status: "error", data: "Unauthorized - Invalid Token" });
  }
};
exports.logout = async (req, res, next) => {
  try {
    const { token, name } = req.body;
    if (token) {
      const tokenId = await Token.findOne({ token });
      if (tokenId) {
        const id = await TokenID.findOne({ tokenID: tokenId._id });
        if (id) {
          if (!name) {
            await Token.findByIdAndDelete(tokenId._id);
            await TokenID.findByIdAndDelete(id._id);
            res
              .status(200)
              .json({ status: "ok", message: "Logged out successfully" });
          } else {
            await TokenID.findByIdAndDelete(id._id);
            res
              .status(200)
              .json({ status: "ok", message: "Web Session Ended" });
          }
        } else {
          if (!name) {
            await Token.findByIdAndDelete(tokenId._id);
            res
              .status(200)
              .json({ status: "ok", message: "Logged out successfully" });
          } else {
            res
              .status(200)
              .json({ status: "ok", message: "Session Not Available" });
          }
        }
      }
    } else {
      res
        .status(200)
        .json({ status: "error", data: "Logged out successfully" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
