import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getDailyQuests, submitQuest, rerollQuest, adminResetUserQuest } from "../controllers/quest.controller.js";

const router = express.Router();

router.get("/", protectRoute, getDailyQuests);
router.post("/submit", protectRoute, submitQuest);
router.put("/reroll/:id", protectRoute, rerollQuest);

// --- ROUTE KHUSUS ADMIN ---
router.post("/admin-reset/:id", protectRoute, adminResetUserQuest);

export default router;