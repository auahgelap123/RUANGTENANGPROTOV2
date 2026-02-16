import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { rateUser, sendFriendRequest, acceptFriendRequest, removeContact } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/rate/:id", protectRoute, rateUser);

// JALUR PERTEMANAN
router.post("/request/:id", protectRoute, sendFriendRequest); // Kirim Request / Add
router.post("/accept/:id", protectRoute, acceptFriendRequest); // Terima Request
router.post("/remove/:id", protectRoute, removeContact); // Unfriend

export default router;