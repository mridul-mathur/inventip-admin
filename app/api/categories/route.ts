import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { MongoServerError, ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    let categoryName = formData.get("category") as string;

    if (!categoryName) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }
    categoryName = categoryName.trim().toLowerCase();
    const { db } = await connectToDatabase();
    await db
      .collection("categories")
      .createIndex({ category: 1 }, { unique: true });
    const newCategory = await db
      .collection("categories")
      .insertOne({ category: categoryName });
    const insertedCategory = await db
      .collection("categories")
      .findOne({ _id: newCategory.insertedId });
    return NextResponse.json(
      {
        message: "Category added successfully",
        category: insertedCategory,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add category", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const categoryId = url.searchParams.get("id");

    if (!categoryId || !ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { error: "Invalid Category ID" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const associatedBlogs = await db
      .collection("blogs")
      .find({ category: new ObjectId(categoryId) })
      .project({ title: 1 })
      .toArray();

    if (associatedBlogs.length > 0) {
      return NextResponse.json(
        {
          error: "Category cannot be deleted as it is associated with blogs",
          associatedBlogs: associatedBlogs.map(
            (blog: { title: string }) => blog.title
          ),
        },
        { status: 400 }
      );
    }

    const result = await db
      .collection("categories")
      .deleteOne({ _id: new ObjectId(categoryId) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Category not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category", details: (error as Error).message },
      { status: 500 }
    );
  }
}
