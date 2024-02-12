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
var connectedClients = [];
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://next-api-ruby.vercel.app",
      "http://localhost:3001",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// Set up CORS headers for Express routes
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

io.on("connection", (socket) => {
  connectedClients.push({ id: socket.id });
  console.log("User connected");
  socket.on("disconnect", () => {
    console.log("User Disconnected");
    connectedClients = connectedClients.filter(
      (client) => client.id !== socket.id
    );
  });
  socket.on("message", async (obj) => {
    await Message.create(obj);
    const allData = await Message.find({});
    io.emit("message", allData);
  });
});
