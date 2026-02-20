import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

// Import digabung jadi satu biar rapi dan gak error
import { 
  getUsersForSidebar,
  rateUser, 
  sendFriendRequest, 
  acceptFriendRequest, 
  removeContact, 
  addGameWin, 
  getLeaderboard,
  buyChatTime
} from "../controllers/user.controller.js";

import { 
  // ... fungsi yang lama biarin aja
  adminUpdatePoints, 
  adminUpdateChatTime 
} from "../controllers/user.controller.js";

const router = express.Router();

// --- ROUTE GET USERS (WAJIB ADA BIAR SIDEBAR GAK CRASH) ---
router.get("/", protectRoute, getUsersForSidebar);

// --- ROUTE USER LAINNYA ---
router.post("/rate/:id", protectRoute, rateUser);
router.post("/request/:id", protectRoute, sendFriendRequest);
router.post("/accept/:id", protectRoute, acceptFriendRequest);
router.post("/remove/:id", protectRoute, removeContact);

// --- ROUTE GAME (ARCADE) ---
router.put("/add-win", protectRoute, addGameWin);
router.get("/leaderboard", protectRoute, getLeaderboard);

// --- POINT SYSTEM ---
router.post("/buy-time", protectRoute, buyChatTime);

// --- ROUTE KHUSUS ADMIN ---
router.post("/admin/points/:id", protectRoute, adminUpdatePoints);
router.post("/admin/time/:id", protectRoute, adminUpdateChatTime);

export default router;