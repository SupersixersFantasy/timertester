import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

const TIMER_DURATION = 60; // 60 seconds

io.on("connection", (socket) => {
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        timer: TIMER_DURATION,
        running: false,
        interval: null,
        runCount: 0,
      });
    }
    const room = rooms.get(roomId);
    socket.emit("timer", room.timer);
    socket.emit("timerStatus", room.running);
    socket.emit("runCount", room.runCount);
  });

  socket.on("toggleTimer", (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.running = !room.running;
      if (room.running) {
        room.interval = setInterval(() => {
          room.timer--;
          if (room.timer <= 0) {
            console.log("Timer finished!");
            room.runCount++;
            if (room.runCount >= 10) {
              clearInterval(room.interval);
              io.to(roomId).emit("roomClosed");
              rooms.delete(roomId);
            } else {
              room.timer = TIMER_DURATION;
            }
          }
          io.to(roomId).emit("timer", room.timer);
          io.to(roomId).emit("runCount", room.runCount);
        }, 1000);
      } else {
        clearInterval(room.interval);
      }
      io.to(roomId).emit("timerStatus", room.running);
    }
  });

  socket.on("resetTimer", (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      clearInterval(room.interval);
      room.running = false;
      room.runCount++;
      if (room.runCount >= 10) {
        clearInterval(room.interval);
        io.to(roomId).emit("roomClosed");
        rooms.delete(roomId);
      } else {
        room.timer = TIMER_DURATION;
      }
      io.to(roomId).emit("timer", room.timer);
      io.to(roomId).emit("timerStatus", room.running);
    }
  });
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});
