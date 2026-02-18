import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { rateUser, sendFriendRequest, acceptFriendRequest, removeContact, addGameWin, getLeaderboard } from "../controllers/user.controller.js";

const router = express.Router();

// --- ROUTE USER LAINNYA ---
router.post("/rate/:id", protectRoute, rateUser);
router.post("/request/:id", protectRoute, sendFriendRequest);
router.post("/accept/:id", protectRoute, acceptFriendRequest);
router.post("/remove/:id", protectRoute, removeContact);

// --- ROUTE GAME (ARCADE) ---
router.put("/add-win", protectRoute, addGameWin);
router.get("/leaderboard", protectRoute, getLeaderboard);

export default router;