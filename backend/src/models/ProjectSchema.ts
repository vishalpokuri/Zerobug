import mongoose, { Schema } from "mongoose";
const projectSchema = new Schema({
  endpoints: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EndpointData",
      required: true,
    },
  ],
});

const Project = mongoose.model("Project", projectSchema);
export default Project;
