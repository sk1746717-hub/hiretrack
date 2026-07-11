import express from "express";
import {
  getUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser
} from "../controllers/adminController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(admin);

router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

export default router;
