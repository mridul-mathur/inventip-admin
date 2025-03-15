import { Schema, model, models } from "mongoose";

const CareerSchema = new Schema({
  position: { type: String, required: true },
  location: { type: String, required: true },
  duration: { type: String, required: true },
  pay: { type: String, required: true },
  job_desc: { type: String, required: true },
  skills: [{ type: String, required: true }],
  file_url: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CareersModel = models.Career || model("Career", CareerSchema);

export default CareersModel;
