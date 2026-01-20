const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const http = require("http");
const server = http.createServer(app);

const allowedOrigins = [
  "https://www.live-scorecard.com",
  "https://golf-scorecard-app.vercel.app",
  "https://golf-scorecard-app-git-main-born4this-projects.vercel.app",
  "https://golf-scorecard-jseamlkx9-born4this-projects.vercel.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH"],
    credentials: true
  })
);

app.use(express.json());

//sockets
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH"],
    credentials: true
  }
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const userRoutes  = require("./routes/users");
const groupRoutes = require("./routes/groups")(io);   // ← pass io into group routes
const scoreRoutes = require("./routes/scores")(io);

app.use("/api/users",  userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/scores",  scoreRoutes);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group ${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// start
const PORT = process.env.PORT || 5050;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
