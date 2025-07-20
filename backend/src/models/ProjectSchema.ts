import mongoose, { Schema } from "mongoose";
import { endpointDataSchema } from "./EndpointDataSchema";

const projectSchema = new Schema({
  endpoints: [endpointDataSchema],
});

const Project = mongoose.model("Project", projectSchema);
export default Project;
