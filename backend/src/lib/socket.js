import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// Map buat nyimpen user online: {userId: socketId}
const userSocketMap = {}; 

export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

// --- INI PEMBUKA KONEKSI ---
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // Broadcast user online
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Logic Disconnect
  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // --- LOGIC GAME MULTIPLAYER (SEMUA HARUS DI DALAM SINI) ---
  
  // 1. Invite Game
  socket.on("gameInvite", ({ targetId, gameType }) => {
    const targetSocketId = getReceiverSocketId(targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("gameInviteReceived", {
        fromId: userId,
        gameType, 
      });
    }
  });

  // 2. Accept Game
  socket.on("gameAccept", ({ targetId, gameType }) => {
    const targetSocketId = getReceiverSocketId(targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("gameStart", { opponentId: userId, role: "HOST", gameType });
      socket.emit("gameStart", { opponentId: targetId, role: "GUEST", gameType });
    }
  });

  // 3. Move / Aksi Game
  socket.on("gameMove", ({ targetId, moveData }) => {
    const targetSocketId = getReceiverSocketId(targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("gameMoveReceived", moveData);
    }
  });

  // 4. Reset / Quit
  socket.on("gameAction", ({ targetId, action }) => {
    const targetSocketId = getReceiverSocketId(targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("gameActionReceived", action);
    }
  });

  // 5. Next Round (Reset Papan, Skor Tetap)
  socket.on("gameNextRound", ({ targetId }) => {
    const targetSocketId = getReceiverSocketId(targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("gameNextRoundReceived");
    }
  });

  // 6. Shared Music (Ganti Lagu Barengan)
  socket.on("musicChange", ({ targetId, vibe }) => { 
    const targetSocketId = getReceiverSocketId(targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("musicChangeReceived", vibe);
    }
  });

  // 7. DISCORD STYLE MUSIC BOT
  socket.on("musicBotAction", ({ targetId, action, data }) => { 
    const targetSocketId = getReceiverSocketId(targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("musicBotActionReceived", { action, data });
    }
  });

}); 
// --- INI PENUTUP KONEKSI (JANGAN TARUH KODE SOCKET DI BAWAH INI) ---

export { io, app, server };