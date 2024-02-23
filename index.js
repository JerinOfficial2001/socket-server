const mongoose = require("mongoose");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const cors = require("cors");
app.use(cors());
const { Message } = require("./model/message");
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
  path: "/socket",
  // wsEngine: ["ws", "wss"],
  transports: ["websocket", "polling"],
  cors: {
    origin: "*",
  },
  // allowEIO3: true,
});
app.get("/", (req, res) => {
  res.write(`<h1>Socket Server is running on:${PORT}</h1>`);
});
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("message", async (obj) => {
    await Message.create(obj);
    const allData = await Message.find({});
    io.emit("message", allData);
  });
  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});
