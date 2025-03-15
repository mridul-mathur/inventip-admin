import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { uploadToS3 } from "@/lib/aws";
import { ObjectId } from "mongodb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS, PUT",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const brief = formData.get("brief") as string;
    const categoryId = formData.get("category") as string;
    const titleImageFile = formData.get("titleImage") as Blob | null;
    const segmentsJson = formData.get("segments") as string;
    const tagsJson = formData.get("tags") as string;

    if (!title || !brief || !segmentsJson || !categoryId || !tagsJson) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    const parsedSegments = JSON.parse(segmentsJson);
    const parsedTags = tagsJson ? JSON.parse(tagsJson) : [];
    const { db } = await connectToDatabase();

    // ✅ Ensure `categoryId` is a valid ObjectId
    if (!ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    const categoryObject = new ObjectId(categoryId);

    // ✅ Check if category exists
    const categoryExists = await db
      .collection("categories")
      .findOne({ _id: categoryObject });
    if (!categoryExists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // ✅ Convert tags to ObjectId array
    const tagObjects = parsedTags
      .filter((tagId: string) => ObjectId.isValid(tagId))
      .map((tagId: string) => new ObjectId(tagId));

    let titleImageUrl = "https://via.placeholder.com/800x400";
    if (titleImageFile) {
      titleImageUrl = await uploadToS3(titleImageFile, "blogs/titles");
    }

    const blog = {
      _id: new ObjectId(),
      title,
      brief,
      category: categoryObject,
      title_image: titleImageUrl,
      segments: parsedSegments,
      tags: tagObjects,
      created_at: new Date(),
    };

    const result = await db.collection("blogs").insertOne(blog);

    return NextResponse.json(
      { message: "Blog added successfully", data: result.insertedId },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create blog", details: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}
