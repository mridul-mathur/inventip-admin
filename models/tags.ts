import { Schema, model, models } from "mongoose";

const TagsSchema = new Schema({
  tag: { type: String, required: true, unique: true },
});

const TagsModel = models.Tag || model("Tag", TagsSchema);

export default TagsModel;
