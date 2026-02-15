import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUsersForSidebar, getMessages, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();

// Jalur 1: Ambil semua user buat di Sidebar (Ini yang tadi 404)
router.get("/users", protectRoute, getUsersForSidebar);

// Jalur 2: Ambil isi chat sama user tertentu
router.get("/:id", protectRoute, getMessages);

// Jalur 3: Kirim pesan
router.post("/send/:id", protectRoute, sendMessage);

export default router;