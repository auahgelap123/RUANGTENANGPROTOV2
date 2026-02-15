import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { rateUser } from "../controllers/user.controller.js"; // Pastiin controller user udah ada logic rateUser

const router = express.Router();

router.post("/rate/:id", protectRoute, rateUser);

export default router;