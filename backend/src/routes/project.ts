import { Router } from "express";
import { createProject, addEndpointData } from "../controller/project";

const router = Router();

router.post("/create", createProject);
router.post("/add-endpoint", addEndpointData);

export default router;
