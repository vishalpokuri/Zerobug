import mongoose, { Schema } from "mongoose";
import { endpointDataSchema } from "./EndpointDataSchema";

const projectSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  lastEdited: { type: Date, default: Date.now },
  endpoints: [endpointDataSchema],
});

const Project = mongoose.model("Project", projectSchema);
export default Project;
