import express from "express";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
} from "../controllers/templateController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getTemplates)
  .post(createTemplate);

router.route("/:id")
  .put(updateTemplate)
  .delete(deleteTemplate);

export default router;
