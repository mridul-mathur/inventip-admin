import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { deleteFromS3 } from "@/lib/aws";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS, PUT",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders });
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid Blog ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { db } = await connectToDatabase();
    const blogEntry = await db
      .collection("blogs")
      .findOne({ _id: new ObjectId(id) });

    if (!blogEntry) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const imagesToDelete = [
      blogEntry.title_image,
      ...(Array.isArray(blogEntry.segments)
        ? blogEntry.segments.map((segment: any) => segment.seg_img)
        : []),
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
      .collection("blogs")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete blog" },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: "Blog deleted successfully" },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete blog", details: (error as any).message },
      { status: 500, headers: corsHeaders }
    );
  }
}
