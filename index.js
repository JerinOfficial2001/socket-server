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
const { log } = require("console");
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
const ioVchat = new Server(httpServer, {
  path: "/vchat",
  // // wsEngine: ["ws", "wss"],
  transports: ["polling"],
  cors: {
    origin: "*",
  },
  // allowEIO3: true,
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
app.get("/", (req, res) => {
  res.json(`Socket Server is running on:${PORT}`);
});
let activeUsers = [];
let watchingUsers = [];
let typingUsers = [];
const rooms = {};

io.on("connection", (socket) => {
  //*JersApp
  io.emit("getNotification", { status: "ok" });
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
app.get("/create-room", (req, res) => {
  const roomID = uuidv4();
  rooms[roomID] = [];
  res.json({ roomID });
});
ioGroupVchat.on("connection", (socket) => {
  if (socket.handshake.query.userID) {
    socket.on("join room", ({ roomID, userID }) => {
      if (rooms[roomID]) {
        rooms[roomID].push(userID);
        console.log(rooms, "test");
        io.emit("rooms", rooms);
        const usersInRoom = rooms[roomID].filter((id) => id !== userID);
        io.emit("all users", usersInRoom);
      } else {
        io.emit("error", "Room not found");
      }
    });

    socket.on("sending signal", (payload) => {
      io.to(payload.userToSignal).emit("user joined", {
        signal: payload.signal,
        callerID: payload.callerID,
      });
    });

    socket.on("returning signal", (payload) => {
      io.to(payload.callerID).emit("receiving returned signal", {
        signal: payload.signal,
        id: payload.userID,
      });
    });

    socket.on("disconnect", () => {
      for (const roomID in rooms) {
        rooms[roomID] = rooms[roomID].filter(
          (id) => id !== socket.handshake.query.userID
        );
      }
    });
  }
});
