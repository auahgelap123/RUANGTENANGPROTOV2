import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getDailyQuests, submitQuest, rerollQuest } from "../controllers/quest.controller.js";

const router = express.Router();

router.get("/", protectRoute, getDailyQuests);
router.post("/submit", protectRoute, submitQuest);
router.put("/reroll/:id", protectRoute, rerollQuest); // <--- Jalur Reroll

export default router;