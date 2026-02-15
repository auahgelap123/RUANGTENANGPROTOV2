import express from "express";
import { protectRoute, checkAdmin } from "../middleware/auth.middleware.js";
import { getAllUsersForAdmin, updateUserRole } from "../controllers/admin.controller.js";

const router = express.Router();

// Route ini dijaga 2 satpam: protectRoute (Harus Login) & checkAdmin (Harus Admin)
router.get("/users", protectRoute, checkAdmin, getAllUsersForAdmin);
router.put("/update-role/:userId", protectRoute, checkAdmin, updateUserRole);

export default router;