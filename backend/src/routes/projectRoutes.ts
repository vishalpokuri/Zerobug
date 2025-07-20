import { Router } from "express";
import {
  createProject,
  saveProject,
  getProjects,
  getProjectById,
} from "../controller/project";

const router = Router();

router.post("/create", createProject);
router.post("/save", saveProject);
router.get("/user/:userId", getProjects);
router.get("/:projectId", getProjectById);

export default router;
