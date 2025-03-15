import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { MongoServerError } from "mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    let tagName = formData.get("tag") as string;

    if (!tagName) {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }

    tagName = tagName.trim().toLowerCase();

    const { db } = await connectToDatabase();
    await db.collection("tags").createIndex({ tag: 1 }, { unique: true });

    const newTag = await db.collection("tags").insertOne({ tag: tagName });

    const insertedTag = await db
      .collection("tags")
      .findOne({ _id: newTag.insertedId });

    return NextResponse.json(
      {
        message: "Tag added successfully",
        tag: insertedTag,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return NextResponse.json(
        { error: "Tag already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add tag", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const tagId = url.searchParams.get("id");

    if (!tagId || !ObjectId.isValid(tagId)) {
      return NextResponse.json({ error: "Invalid Tag ID" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const associatedBlogs = await db
      .collection("blogs")
      .find({ tags: new ObjectId(tagId) })
      .project({ title: 1 })
      .toArray();

    if (associatedBlogs.length > 0) {
      return NextResponse.json(
        {
          error: "Tag cannot be deleted as it is associated with blogs",
          associatedBlogs: associatedBlogs.map(
            (blog: { title: string }) => blog.title
          ),
        },
        { status: 400 }
      );
    }
    const result = await db
      .collection("tags")
      .deleteOne({ _id: new ObjectId(tagId) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Tag not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Tag deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag", details: (error as Error).message },
      { status: 500 }
    );
  }
}
