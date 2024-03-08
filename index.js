const mongoose = require("mongoose");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const cors = require("cors");
app.use(cors());
app.use(express.json());
const { Message } = require("./model/message");
require("dotenv").config();
const db = process.env.MONGO_DB;
mongoose.connect(db).then(() => {
  console.log("DB Connected");
});
//*Routes
const Messages = require("./routes/message");
const Auth = require("./routes/users");
const Token = require("./routes/token");

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const io = new Server(httpServer, {
  path: "/socket",
  // wsEngine: ["ws", "wss"],
  transports: ["polling"],
  cors: {
    origin: "*",
  },
  // allowEIO3: true,
});
app.get("/", (req, res) => {
  res.write(`<h1>Socket Server is running on:${PORT}</h1>`);
});
let activeUsers = [];
io.on("connection", (socket) => {
  console.log("User connected");
  socket.on("set_user_id", (userId) => {
    socket.userId = userId;
  });
  socket.on("message", async (obj) => {
    await Message.create(obj);
    const allData = await Message.find({});
    io.emit("message", allData);
    io.emit("receivedMsg", obj);
  });
  socket.on("disconnect", (data) => {
    console.log(socket.id);
    console.log("User Disconnected");
    const disconnectedUserId = socket.userId; // Assuming socket.id is the user ID
    const currentArr = activeUsers.filter(
      (user) => user.id !== disconnectedUserId
    );
    console.log(currentArr);
    activeUsers = currentArr;
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
      obj.socket = socket.id;
      activeUsers.push(obj);
    }

    io.emit("user_connected", activeUsers);
  });
});

app.use("/api", Messages);
app.use("/api/auth", Auth);
app.use("/api/auth", Token);
