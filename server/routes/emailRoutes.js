import express from "express";
import { sendBulkEmail } from "../controllers/emailController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/send-bulk", upload.array("attachments", 5), sendBulkEmail);

export default router;
