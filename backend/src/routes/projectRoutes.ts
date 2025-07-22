import { Router } from "express";
import {
  createProject,
  saveProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controller/project";

const router = Router();

router.post("/create", createProject);
router.post("/save", saveProject);
router.get("/user/:userId", getProjects);
router.get("/:projectId", getProjectById);
router.put("/:projectId", updateProject);
router.delete("/:projectId", deleteProject);

export default router;
