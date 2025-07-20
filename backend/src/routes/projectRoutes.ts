import { Router } from "express";
import {
  createProject,
  saveProject,
  getProjects,
} from "../controller/project";

const router = Router();

router.post("/create", createProject);
router.post("/save", saveProject);
router.get("/:userId", getProjects);

export default router;
