import { Router } from "express";
import { createProject, saveProject } from "../controller/project";

const router = Router();

router.post("/create", createProject);
router.post("/save", saveProject);

export default router;
