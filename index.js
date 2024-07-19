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
const {
  UpdateLastMsg,
  AddContacts,
  UpdateMsgCount,
} = require("./controller/contacts");
const { WC_grp_message } = require("./model/Groups/message");
const { WC_Group } = require("./model/Groups/group");

app.use(cors());
app.use(express.json());
require("dotenv").config();
const db = process.env.MONGO_DB;
const JERS_folio_DB = process.env.JERS_folio_DB;
mongoose.connect(db).then(() => {
  console.log("DB Connected");
});

// const JERS_DB = mongoose.createConnection(JERS_folio_DB);

// Get the default connection
// const db = mongoose.createConnection(dbURI);

// Event listeners for Mongoose connection
// db.on("connected", () => {
//   console.log(`MONGOOSE CONNECTED `);
// });

// db.on("error", (err) => {
//   console.error(`Mongoose connection error: ${err}`);
// });

// db.on("disconnected", () => {
//   console.log("Mongoose disconnected");
// });
// JERS_DB.on("connected", () => {
//   console.log(`JERS_DB CONNECTED `);
// });

// JERS_DB.on("error", (err) => {
//   console.error(`JERS_DB connection error: ${err}`);
// });

// JERS_DB.on("disconnected", () => {
//   console.log("JERS_DB disconnected");
// });

// // Close the Mongoose connection on process termination
// process.on("SIGINT", () => {
//   db.close(() => {
//     console.log("Mongoose connection disconnected through app termination");
//     process.exit(0);
//   });
// });

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
let usersInGroup = {};
//*JersApp
io.on("connection", async (socket) => {

  const groups = await WC_Group.find({});
  const groupIds = groups.map((elem) => elem._id.toHexString());
  if (groupIds && groupIds.length > 0) {
    for (let id of groupIds) {
      socket.join(id);
    }
  }
  socket.on("me", (id) => {
    socket.join(id);
    console.log("me", id);
  });



  socket.on('offer', data => {
    // console.log('Offer received from', data.from, data.to);
    socket.to(data.to).emit('offer', {
      from: data.from,
      offer: data.offer,
      localStream: data.localStream
    });
  });

  socket.on('answer', data => {
    socket.to(data.to).emit('answer', {
      from: data.from,
      answer: data.answer,
      remoteStream: data.remoteStream
    });
  });

  socket.on('icecandidate', data => {
    // console.log('ICE candidate received from', data.from, data.to);
    socket.to(data.to).emit('icecandidate', {
      from: data.from,
      candidate: data.candidate,
    });
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
      socket.to(obj.receiver).emit("newMsgs", {
        lastMsg: { msg: obj.message, id: obj.receiver },
        count: newMsgs[obj.receiver].length,
      });
      UpdateMsgCount(
        { receiverId: obj.receiver },
        newMsgs[obj.receiver].length
      );
    } else {
      newMsgs[obj.receiver].push({ id: obj.receiver, msg: obj.message });
      socket.to(obj.receiver).emit("newMsgs", {
        lastMsg: { msg: obj.message, id: obj.receiver },
        count: newMsgs[obj.receiver].length,
      });
      UpdateMsgCount(
        { receiverId: obj.receiver },
        newMsgs[obj.receiver].length
      );
    }
  });
  socket.on("clearNewMsg", ({ id, Contact_id }) => {
    newMsgs[id] = [];
    socket.to(id).emit("newMsgs", { count: 0, lastMsg: "" });
    UpdateMsgCount({ Contact_id }, "0");
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
    socket
      .to(obj.receiverId)
      .emit("user_watching", { isWatching: true, id: obj.id });
  });
  socket.on("user_watchout", (obj) => {
    socket
      .to(obj.receiverId)
      .emit("user_watching", { isWatching: false, id: obj.id });
  });
  socket.on("user_typing", (obj) => {
    console.log(obj, "typing");
    socket
      .to(obj.receiverId)
      .emit("user_typing", { isTyping: true, id: obj.id });
  });
  socket.on("user_typed", (obj) => {
    console.log(obj, "typed");

    socket
      .to(obj.receiverId)
      .emit("user_typing", { isTyping: false, id: obj.id });
  });
  socket.on("removeUser", (id) => {
    const currentArr = activeUsers.filter((user) => user.id !== id);
    activeUsers = currentArr;
    io.emit("user_connected", activeUsers);
    socket.leave(id);
  });

  //*Group

  socket.on("send_group_msg", async (obj) => {
    const newMsg = new WC_grp_message(obj);
    const result = await newMsg.save();
    if (result) {
      const group = await WC_Group.findById(obj.group_id);
      if (group) {
        group.messages.push(result._id);
        const isAdded = await group.save();
        if (isAdded) {
          socket.to(obj.group_id).emit("new_group_msg", obj);
        } else {
          console.log({ status: "error", message: "Group msg failed" });
        }
      } else {
        console.log({ status: "error", message: "Group not found" });
      }
    } else {
      console.log({ status: "error", message: "Something went wrong" });
    }
  });
  socket.on("join_group", (obj) => {
    if (!usersInGroup[obj.groupID]) {
      usersInGroup[obj.groupID] = [];
    }
    if (!usersInGroup[obj.groupID].includes(obj.userID)) {
      usersInGroup[obj.groupID].push(obj);
    }
    // console.log(usersInGroup, "Joined", obj.userID);
    io.to(obj.groupID).emit("userInGroup", usersInGroup[obj.groupID]);
  });
  socket.on("remove_group", (obj) => {
    if (!usersInGroup[obj.groupID]) {
      usersInGroup[obj.groupID] = [];
    } else {
      if (usersInGroup[obj.groupID].some((i) => i.userID == obj.userID)) {
        const users = usersInGroup[obj.groupID].filter(
          (elem) => elem.userID != obj.userID
        );
        usersInGroup[obj.groupID] = users;
      }
    }
    // console.log(usersInGroup[obj.groupID], "Leave", obj.userID);

    io.to(obj.groupID).emit("userInGroup", usersInGroup[obj.groupID]);
  });
  socket.on("add_member", async (obj) => {
    // const result = await AddMembersToGroup(obj).then(data => data)
    io.to(obj.groupID).emit("role_updation_result", {
      response: true,
      groupID: obj,
    });
  });
  socket.on("update_role", async (obj) => {
    // const result = await UpdateMemberRole(obj).then(data => data)
    io.to(obj.groupID).emit("role_updation_result", {
      response: true,
      groupID: obj.groupID,
    });
  });
  socket.on("remove_member", async (obj) => {
    // const result = await RemoveMemberFromGroup(obj).then(data => data)
    io.to(obj.groupID).emit("role_updation_result", {
      response: true,
      groupID: obj.groupID,
    });
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
//*Solo Vchat
ioVchat.on("connection", (socket) => {
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
//*Jers-folio
// const Portfolio_FeedBackMsg = new mongoose.Schema(
//   {
//     name: String,
//     image: Object,
//     message: Object,
//     user_id: String,
//   },
//   { timestamps: true }
// );
// const FeedBackMsg = JERS_DB.model(
//   "Portfolio_FeedBackMsg",
//   Portfolio_FeedBackMsg
// );
const ioJersFolio = new Server(httpServer, {
  path: "/jersfolio",
  // // wsEngine: ["ws", "wss"],
  transports: ["polling"],
  cors: {
    origin: "*",
  },
  // allowEIO3: true,
});
ioJersFolio.on("connection", (socket) => {
  socket.on("sendmessage", async (obj) => {
    ioJersFolio.emit("receivemessage", {
      status: "ok",
      message: "Message Send",
    });
  });
});
