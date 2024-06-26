const mongoose = require("mongoose");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const httpServer = createServer(app);
const cors = require("cors");
const { WC_Message } = require("./model/message");
const { VChat_Auth } = require("./model/Vchat_Auth");

const {
  RemoveUser,
  AddUser,
  GetOtherUsers,
  GetUser,
  GetRoomID,
  CreateRoom,
} = require("./controller/roomID");
const { UpdateLastMsg, AddContacts } = require("./controller/contacts");

app.use(cors());
app.use(express.json());
require("dotenv").config();
const dbURI = process.env.MONGO_DB;
// mongoose.connect(db).then(() => {
//   console.log("DB Connected");
// });

mongoose.connect(dbURI);

// Get the default connection
const db = mongoose.connection;

// Event listeners for Mongoose connection
db.on("connected", () => {
  console.log(`MONGOOSE CONNECTED `);
});

db.on("error", (err) => {
  console.error(`Mongoose connection error: ${err}`);
});

db.on("disconnected", () => {
  console.log("Mongoose disconnected");
});

// Close the Mongoose connection on process termination
process.on("SIGINT", () => {
  db.close(() => {
    console.log("Mongoose connection disconnected through app termination");
    process.exit(0);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const io = new Server(httpServer, {
  // path: "/socket",
  // // wsEngine: ["ws", "wss"],
  transports: ["polling"],
  cors: {
    origin: "*",
  },
  // allowEIO3: true,
});
const ioVchat = new Server(httpServer, {
  path: "/vchat",
  // // wsEngine: ["ws", "wss"],
  transports: ["polling"],
  cors: {
    origin: "*",
  },
  // allowEIO3: true,
});
app.get("/", (req, res) => {
  res.json(`Socket Server is running on:${PORT}`);
});
let activeUsers = [];
let rooms = {};
let newMsgs = {};
//*JersApp
io.on("connection", (socket) => {
  console.log("userConnected");
  socket.on("me", (id) => {
    socket.join(id);
    console.log("me", id);
  });
  socket.on("roomID", (id) => {
    socket.join(id);
  });
  socket.on("set_user_id", (userId) => {
    socket.userId = userId;
  });
  socket.on("message", async (obj) => {
    await WC_Message.create(obj);
    const allData = await WC_Message.find({});
    io.emit("message", allData);
    io.emit("receivedMsg", obj);
    socket
      .to(obj.receiver)
      .emit("notification", { msg: obj.message, name: obj.name });

    const isAdded = await AddContacts({
      id: obj.receiver,
      senderID: obj.sender,
      msg: { id: obj.sender, msg: obj.message },
    });
    if (!isAdded) {
      UpdateLastMsg(obj.sender, obj.receiver, {
        id: obj.sender,
        msg: obj.message,
      });
    }

    if (!newMsgs[obj.receiver]) {
      newMsgs[obj.receiver] = [];
      newMsgs[obj.receiver].push({ id: obj.receiver, msg: obj.message });
      socket.to(obj.receiver).emit("newMsgs", newMsgs[obj.receiver]);
      console.log("!", newMsgs);
    } else {
      newMsgs[obj.receiver].push({ id: obj.receiver, msg: obj.message });
      socket.to(obj.receiver).emit("newMsgs", newMsgs[obj.receiver]);
      console.log("+", newMsgs);
    }
  });
  socket.on("clearNewMsg", ({ id, receiverID }) => {
    console.log("test");
    newMsgs[id] = [];
    socket.to(receiverID).emit("newMsgs", newMsgs[id]);
  });
  socket.on("disconnect", () => {
    console.log("User Disconnected");
    const disconnectedUserId = socket.userId;
    const currentArr = activeUsers.filter(
      (user) => user.id !== disconnectedUserId
    );
    activeUsers = currentArr;
    io.emit("user_connected", activeUsers);
  });
  socket.on("user_connected", (obj) => {
    const alreadyActiveIndex = activeUsers.findIndex(
      (user) => user.id == obj.id
    );
    if (alreadyActiveIndex !== -1) {
      activeUsers[alreadyActiveIndex].status = "online";
    } else {
      obj.status = "online";
      obj.socket = socket.userId;
      activeUsers.push(obj);
    }
    io.emit("user_connected", activeUsers);
  });
  socket.on("user_watching", (obj) => {
    socket.to(obj.receiverId).emit("user_watching", { isWatching: true });
  });
  socket.on("user_watchout", (obj) => {
    socket.to(obj.receiverId).emit("user_watching", { isWatching: false });
  });
  socket.on("user_typing", (obj) => {
    socket.to(obj.receiverId).emit("user_typing", { isTyping: true });
  });
  socket.on("user_typed", (obj) => {
    socket.to(obj.receiverId).emit("user_typing", { isTyping: false });
  });
});
//*V_CHAT
app.post("/vChat/auth", async (req, res) => {
  try {
    const user = await VChat_Auth.findOne({ email: req.body.email });

    if (!user) {
      const result = await VChat_Auth.create(req.body);
      if (result) {
        res.status(200).json({ status: "ok", data: result });
      } else {
        res
          .status(200)
          .json({ status: "error", message: "something went wrong" });
      }
    } else {
      res.status(200).json({ status: "ok", data: user });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: error });
  }
});
ioVchat.on("connection", (socket) => {
  //*Solo Vchat
  socket.on("me", (id) => {
    socket.join(id);
    ioVchat.to(id).emit("me", id);
  });
  socket.on("callUser", (data) => {
    ioVchat.to(data.userToCall).emit("callUser", {
      from: data.from,
      signal: data.signalData,
      name: data.name,
    });
  });
  socket.on("answerCall", (data) => {
    ioVchat.to(data.to).emit("callAccepted", data.signal);
  });
  socket.on("callEnded", (data) => {
    ioVchat.emit("callEnded", data);
  });
});
//*Group Vchat
app.get("/create-room", async (req, res) => {
  const roomID = uuidv4();
  res.json({ roomID });
  CreateRoom(roomID);
});

const ioGroupVchat = new Server(httpServer, {
  path: "/groupvchat",
  // // wsEngine: ["ws", "wss"],
  transports: ["polling"],
  cors: {
    origin: "*",
  },
  // allowEIO3: true,
});
ioGroupVchat.on("connection", (socket) => {
  console.log("server is connected");

  socket.on("join-room", (roomId, userId) => {
    console.log(`a new user ${userId} joined room ${roomId}`);
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);
  });

  socket.on("user-toggle-audio", (userId, roomId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-toggle-audio", userId);
  });

  socket.on("user-toggle-video", (userId, roomId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-toggle-video", userId);
  });

  socket.on("user-leave", (userId, roomId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-leave", userId);
  });
});
