import { Schema, model, models } from "mongoose";

const SegmentSchema = new Schema({
  head: { type: String, required: false },
  subhead: { type: String, required: false },
  content: { type: String, required: false },
  seg_img: { type: String, required: false },
});

const BlogSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  title_image: { type: String, required: true },
  segments: [SegmentSchema],
});

const CareerSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  position: { type: String, required: true },
  location: { type: String, required: true },
  duration: { type: String, required: true },
  pay: { type: String, required: true },
  job_desc: { type: String, required: true },
  skills: [{ type: String, required: true }],
});

const MainSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  blogs: [BlogSchema],
  careers: [CareerSchema],
});

const MainModel = models.Main || model("Main", MainSchema);

export default MainModel;
