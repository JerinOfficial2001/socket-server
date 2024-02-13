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
const sessions = new Map();

mongoose.connect(db).then(() => {
  console.log("DB Connected");
  sessions.set("test", 1);
});
const options = [
  cors({
    origin: "*",
    methods: "*",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
];

app.use(options);
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
var connectedClients = [];
const io = new Server(
  httpServer
  // , {
  // cors: {
  //   origin: [
  //     "https://next-api-ruby.vercel.app",
  //     "http://localhost:3001",
  //     "http://localhost:3000",
  //   ],
  //   methods: ["GET", "POST"], // Specify allowed methods
  //   allowedHeaders: ["Content-Type", "Authorization"],
  // },
  // }
);
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
console.log(sessions);
io.on("connection", (socket) => {
  socket.on("authenticate", (sessionId) => {
    if (sessionId) {
      // Check if the session ID exists in the session map
      if (sessions.has(sessionId)) {
        // Associate the socket with the session ID
        sessions.set(sessionId, socket.id);
        console.log(`User authenticated with session ID: ${sessionId}`);
        socket.emit("authenticated");
      } else {
        console.log(`Session ID ${sessionId} not found`);
        socket.emit("authentication_failed", "Session ID not found");
      }
    } else {
      console.log("Invalid session ID format");
      socket.emit("authentication_failed", "Invalid session ID");
    }
  });
  console.log("User connected");
  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
  socket.on("message", async (obj) => {
    await Message.create(obj);
    const allData = await Message.find({});
    io.emit("message", allData);
  });
});
