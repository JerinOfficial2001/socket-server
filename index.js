const mongoose = require("mongoose");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const httpServer = createServer(app);
const cors = require("cors");
const { WC_Message } = require("./model/message");
app.use(cors());
app.use(express.json());
require("dotenv").config();
const db = process.env.MONGO_DB;
mongoose.connect(db).then(() => {
  console.log("DB Connected");
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
app.get("/", (req, res) => {
  res.json(`Socket Server is running on:${PORT}`);
});
let activeUsers = [];
let watchingUsers = [];
let typingUsers = [];
const rooms = {};

app.get("/create-room", (req, res) => {
  const roomID = uuidv4();
  rooms[roomID] = [];
  res.json({ roomID });
});
io.on("connection", (socket) => {
  //*Solo Vchat
  socket.emit("me", socket.id);
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", socket.id);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", socket.id);
    });

    socket.on("signal", (data) => {
      io.to(data.target).emit("signal", data);
    });
  });
  //* Group Vchat
  socket.on("create room", (callback) => {
    const roomID = uuidv4();
    rooms[roomID] = [];
    callback(roomID);
  });

  socket.on("join room", ({ roomID }) => {
    if (rooms[roomID]) {
      rooms[roomID].push(socket.userId);
      const usersInRoom = rooms[roomID].filter((id) => id !== socket.userId);
      socket.emit("all users", usersInRoom);
    } else {
      socket.emit("error", "Room not found");
    }
  });

  socket.on("sending signal", (payload) => {
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: socket.userId,
    });
  });

  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.userId,
    });
  });

  socket.on("disconnect", () => {
    for (const roomID in rooms) {
      rooms[roomID] = rooms[roomID].filter((id) => id !== socket.userId);
    }

    const disconnectedUserId = socket.userId;
    activeUsers = activeUsers.filter((user) => user.id !== disconnectedUserId);
    io.emit("user_connected", activeUsers);
    console.log(activeUsers, "activeUsers");
  });
  //*JersApp
  io.emit("getNotification", { status: "ok" });
  console.log("User connected");
  socket.on("set_user_id", (userId) => {
    socket.userId = userId;
  });
  socket.on("message", async (obj) => {
    await WC_Message.create(obj);
    const allData = await WC_Message.find({});
    io.emit("message", allData);
    io.emit("receivedMsg", obj);
  });
  socket.on("disconnect", () => {
    console.log("User Disconnected");
    const disconnectedUserId = socket.userId; // Assuming socket.id is the user ID
    const currentArr = activeUsers.filter(
      (user) => user.id !== disconnectedUserId
    );

    activeUsers = currentArr;
    io.emit("user_connected", activeUsers);
    console.log(activeUsers, "activeUsers");
  });
  socket.on("user_connected", (obj) => {
    const alreadyActiveIndex = activeUsers.findIndex(
      (user) => user.id == obj.id
    );

    if (alreadyActiveIndex !== -1) {
      // User is already active, update status to "online"
      activeUsers[alreadyActiveIndex].status = "online";
    } else {
      // Add user to the list with status "online"
      obj.status = "online";
      obj.socket = socket.userId;
      activeUsers.push(obj);
    }
    console.log("user_connected", activeUsers);
    io.emit("user_connected", activeUsers);
  });

  socket.on("user_watching", (obj) => {
    const alreadyActiveIndex = watchingUsers.findIndex(
      (user) => user.id == obj.id
    );

    if (alreadyActiveIndex !== -1) {
      // User is already active, update status to "online"
      watchingUsers[alreadyActiveIndex].status = true;
    } else {
      // Add user to the list with status "online"
      obj.status = true;
      obj.socket = socket.userId;
      watchingUsers.push(obj);
    }

    io.emit("user_watching", watchingUsers);
    console.log(watchingUsers, "user_watching");
  });
  socket.on("user_watchout", (id) => {
    const currentArr = watchingUsers.filter((user) => user.id !== id);

    watchingUsers = currentArr;
    io.emit("user_watching", watchingUsers);
    console.log(watchingUsers, "user_watching");
  });
  socket.on("user_typing", (obj) => {
    const alreadyActiveIndex = typingUsers.findIndex(
      (user) => user.id == obj.id
    );

    if (alreadyActiveIndex !== -1) {
      // User is already active, update status to "online"
      typingUsers[alreadyActiveIndex].status = true;
    } else {
      // Add user to the list with status "online"
      obj.status = true;
      obj.socket = socket.userId;
      typingUsers.push(obj);
    }

    io.emit("user_typing", typingUsers);
    console.log(typingUsers, "user_typing");
  });
  socket.on("user_typed", (id) => {
    const currentArr = typingUsers.filter((user) => user.id !== id);

    typingUsers = currentArr;
    io.emit("user_typing", typingUsers);
    console.log(typingUsers, "user_typing");
  });
});
