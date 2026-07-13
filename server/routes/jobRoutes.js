import express from "express";
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
} from "../controllers/jobController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Apply auth middleware to all job routes
router.use(protect);

router.route("/")
  .get(getJobs)
  .post(requireRole(["Admin", "HR"]), createJob);

router.route("/:id")
  .get(getJobById)
  .put(requireRole(["Admin", "HR"]), updateJob)
  .delete(requireRole(["Admin", "HR"]), deleteJob);

export default router;
