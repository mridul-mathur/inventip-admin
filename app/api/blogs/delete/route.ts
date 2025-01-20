import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { deleteFromS3 } from "@/lib/aws";

export async function DELETE(req: Request) {
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

    const blogEntry = await db
      .collection("data")
      .findOne(
        { "blogs._id": new ObjectId(id) },
        { projection: { "blogs.$": 1 } }
      );

    if (!blogEntry || !blogEntry.blogs || blogEntry.blogs.length === 0) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const blogToDelete = blogEntry.blogs[0];
    console.log("Blog to delete:", blogToDelete);

    const imagesToDelete = [
      blogToDelete.title_image,
      ...blogToDelete.segments.map((segment: any) => segment.seg_img),
    ];

    await Promise.all(
      imagesToDelete.map((imageUrl) => {
        if (imageUrl && !imageUrl.includes("placeholder")) {
          return deleteFromS3(imageUrl);
        }
        return Promise.resolve();
      })
    );

    const result = await db
      .collection("data")
      .updateOne(
        { "blogs._id": new ObjectId(id) },
        { $pull: { blogs: { _id: new ObjectId(id) } as any } }
      );

    console.log("Deletion Result:", result);

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete blog" },
        { status: 500 }
      );
    }

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
