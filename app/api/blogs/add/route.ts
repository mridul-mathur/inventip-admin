import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { runMiddleware } from "@/lib/multer";
import { uploadToS3 } from "@/lib/aws";
import { ObjectId } from "mongodb";
import { z } from "zod";

export const config = {
  api: {
    bodyParser: false,
  },
};

const blogSegmentSchema = z.object({
  head: z.string().min(1, "Heading is required"),
  subhead: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  seg_img: z.string().optional(),
});

const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  segments: z.array(blogSegmentSchema),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const expressReq = await runMiddleware(req);

    const formData = new Map();
    for (const [key, value] of Object.entries(expressReq.body)) {
      formData.set(key, value);
    }

    const title = formData.get("title") as string;
    const titleImageFile = formData.get("titleImage")?.[0];
    const segmentsJson = formData.get("segments") as string;

    // Validation
    const validationResult = blogSchema.safeParse({
      title,
      segments: JSON.parse(segmentsJson),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.message },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Upload title image
    let titleImageUrl = "https://via.placeholder.com/200"; // Default image
    if (titleImageFile) {
      titleImageUrl = await uploadToS3(titleImageFile, "blogs/titles");
    }

    // Process and upload segment images
    const segments = await Promise.all(
      JSON.parse(segmentsJson).map(async (segment: any, index: number) => {
        const segmentImage = formData.get(`segments[${index}][image]`)?.[0];

        let segImageUrl = "https://via.placeholder.com/200"; // Default image
        if (segmentImage) {
          segImageUrl = await uploadToS3(segmentImage, `blogs/segments`);
        }

        return {
          ...segment,
          seg_img: segImageUrl,
        };
      })
    );

    // Create blog document
    const blog = {
      _id: new ObjectId(),
      title,
      title_image: titleImageUrl,
      segments,
    };

    // Insert into database
    const result = await db
      .collection("data")
      .updateOne(
        { _id: new ObjectId("6770024bbe48f97acdd6de6f") },
        { $push: { blogs: blog } as any },
        { upsert: true }
      );

    if (result.modifiedCount === 0 && !result.upsertedCount) {
      throw new Error("Failed to update the existing document.");
    }

    return NextResponse.json(
      { message: "Blog added successfully", data: blog },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating blog:", error); // Debug
    return NextResponse.json(
      {
        error: "Failed to create blog",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
