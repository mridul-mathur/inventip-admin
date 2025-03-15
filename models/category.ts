import { Schema, model, models } from "mongoose";

const CategoriesSchema = new Schema({
  category: { type: String, required: true, unique: true },
});

const CategoriesModel = models.Category || model("Category", CategoriesSchema);

export default CategoriesModel;
