import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(req: Request) {
  console.log("DELETE /api/blogs/delete");

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    console.log("Received Blog ID in DELETE route:", id);

    if (!id) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    console.log("Connected to database for deletion.");

    const result = await db
      .collection("data")
      .updateOne(
        { "blogs._id": new ObjectId(id) },
        { $pull: { blogs: { _id: new ObjectId(id) } as any } }
      );

    console.log("Deletion Result:", result);

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Respond with success message
    return NextResponse.json(
      { message: "Blog deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { error: "Failed to delete blog", details: (error as any).message },
      { status: 500 }
    );
  }
}
