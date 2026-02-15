import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";

// IMPORT SEMUA ROUTES
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import questRoutes from "./routes/quest.route.js";
import adminRoutes from "./routes/admin.route.js";
import userRoutes from "./routes/user.route.js"; 

import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// MIDDLEWARE (Settingan Dasar)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// DAFTAR ROUTES (Jalur API)
app.use("/api/auth", authRoutes);       // Login/Register
app.use("/api/messages", messageRoutes);// Chatting
app.use("/api/quests", questRoutes);    // Misi Harian
app.use("/api/admin", adminRoutes);     // Dashboard Admin
app.use("/api/users", userRoutes);      // <--- DAFTARIN DISINI (Buat Rating)

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});