import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getDailyQuests, submitQuest } from "../controllers/quest.controller.js";

const router = express.Router();

router.get("/", protectRoute, getDailyQuests);
router.post("/submit", protectRoute, submitQuest);

export default router;