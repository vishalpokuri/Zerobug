import { Request, Response } from "express";
import Project from "../models/ProjectSchema";
import User from "../models/UserSchema";

export const createProject = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const project = new Project({ endpoints: [] });
    await project.save();
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.projects.push(project._id);
    await user.save();
    res
      .status(201)
      .json({ message: "Created successfully", projectId: project._id });
  } catch (error) {
    res.status(500).json({ error: "Error creating project" });
  }
};

export const saveProject = async (req: Request, res: Response) => {
  try {
    const { projectId, endpoints } = req.body;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    project.endpoints = endpoints;
    await project.save();
    res.status(200).json({ message: "Project saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error saving project" });
  }
};
