const { Token } = require("../model/token");
const { TokenID } = require("../model/tokenID");
exports.getToken = async (req, res, next) => {
  try {
    const token = await Token.find({});

    if (token) {
      res.status(200).json({ status: "ok", data: token });
    } else {
      res.status(404).json({ status: "error", data: "Empty" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
exports.addToken = async (req, res, next) => {
  try {
    const token = await Token.create(req.body);
    if (token) {
      res.status(200).json({ status: "ok", data: token });
    } else {
      res.status(404).json({ status: "error", data: "no data" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
exports.deleteToken = async (req, res, next) => {
  try {
    const { id } = req.query;
    const token = await Token.findByIdAndDelete(id);

    if (token) {
      res.status(200).json({ status: "ok", data: "deleted" });
    } else {
      res.status(404).json({ status: "error", data: "not deleted" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
exports.getTokenID = async (req, res, next) => {
  try {
    const token = await TokenID.find({});
    if (token) {
      res.status(200).json({ status: "ok", data: token });
    } else {
      res.status(404).json({ status: "error", data: "Empty" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
exports.addTokenID = async (req, res, next) => {
  try {
    const token = await TokenID.create(req.body);
    if (token) {
      res.status(200).json({ status: "ok", data: token });
    } else {
      res.status(404).json({ status: "error", data: "Empty" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
exports.deleteTokenID = async (req, res, next) => {
  try {
    const { id } = req.query;
    const token = await TokenID.findByIdAndDelete(id);

    if (token) {
      res.status(200).json({ status: "ok", data: token });
    } else {
      res.status(404).json({ status: "error", data: "Empty" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
exports.getTokenByID = async (req, res, next) => {
  try {
    const { id } = req.query;
    const token = await Token.findById(id);

    if (token) {
      res.status(200).json({ status: "ok", data: token });
    } else {
      res.status(404).json({ status: "error", data: "Empty" });
    }
  } catch (error) {
    next(error);
    res.status(500).send(error);
  }
};
exports.authByTokenID = async (req, res, next) => {
  try {
    const { token, tokenArr } = req.body;
    const filteredTokenID = tokenArr.filter((elem) => elem.token == token);
    res.send(filteredTokenID);
    // if (filteredTokenID) {
    //   const response = await fetch(
    //     "https://socket-server-fhra.onrender.com/api/auth/tokenID",
    //     {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Accept: "application/json",
    //         "Access-Control-Allow-Origin": "*",
    //       },
    //       body: JSON.stringify({ tokenID: filteredTokenID[0]._id }),
    //     }
    //   ).then((res) => res.json());
    //   if (response) {
    //     res.status(200).json({ status: "ok", data: response });
    //   } else {
    //     res.status(200).json({ status: "ok", data: "auth failed" });
    //   }
    // } else {
    //   res.status(200).json({ status: "error", data: "authentication failed" });
    // }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
