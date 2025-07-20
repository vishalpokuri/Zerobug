import { Request, Response } from "express";
import Project from "../models/ProjectSchema";
import User from "../models/UserSchema";

export const createProject = async (req: Request, res: Response) => {
  try {
    const { userId, name, description } = req.body;
    const project = new Project({ name, description, endpoints: [] });
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
    res.status(500).json({ error: error });
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
    project.lastEdited = new Date();
    await project.save();
    res.status(200).json({ message: "Project saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error saving project" });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate("projects");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ projects: user.projects });
  } catch (error) {
    res.status(500).json({ error: "Error getting projects" });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.status(200).json({ project });
  } catch (error) {
    res.status(500).json({ error: "Error getting project" });
  }
};
