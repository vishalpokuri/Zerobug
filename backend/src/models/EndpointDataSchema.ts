import mongoose from "mongoose";

const ParamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

export const endpointDataSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "ALL"],
    required: true,
  },
  url: { type: String, required: true },
  headers: { type: [String], required: true },
  requestDataType: {
    type: String,
    required: true,
    enum: ["params", "query", "body", "none"],
  },
  paramTypes: [ParamSchema],
  queryParamTypes: [ParamSchema],
  bodyParamTypes: [ParamSchema],
});

// No longer creating a model from this schema, as it will be embedded.
