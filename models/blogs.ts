import { Schema, model, models } from "mongoose";

const SegmentSchema = new Schema({
  head: { type: String, required: false },
  subhead: { type: String, required: false },
  content: { type: String, required: false },
  seg_img: { type: String, required: false },
});

const BlogSchema = new Schema({
  title: { type: String, required: true },
  brief: { type: String, required: true },
  title_image: { type: String, required: true },
  segments: [SegmentSchema],
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
  category: { type: Schema.Types.ObjectId, ref: "Category" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const BlogsModel = models.Blog || model("Blog", BlogSchema);

export default BlogsModel;
