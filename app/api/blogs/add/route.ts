import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { uploadToS3 } from "@/lib/aws";
import { z } from "zod";
import { ObjectId } from "mongodb";

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
  title: z.string().min(1),
  brief: z.string().min(1),
  titleImage: z.string(),
  segments: z.array(blogSegmentSchema),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    console.log("FormData keys:", Array.from(formData.keys()));

    const title = formData.get("title") as string;
    const brief = formData.get("brief") as string;
    const titleImageFile = formData.get("titleImage") as Blob | null;
    const segmentsJson = formData.get("segments") as string;

    if (!title || !brief || !segmentsJson) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const parsedSegments = JSON.parse(segmentsJson);
    const validationResult = blogSchema.safeParse({
      title,
      brief,
      titleImage: "placeholder",
      segments: parsedSegments,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.message },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    let titleImageUrl = "https://via.placeholder.com/800x400";
    if (titleImageFile) {
      titleImageUrl = await uploadToS3(titleImageFile, "blogs/titles");
    }

    const enrichedSegments = await Promise.all(
      parsedSegments.map(async (segment: any, index: number) => {
        const segmentImageFile = formData.get(
          `segments[${index}][image]`
        ) as Blob | null;

        let segImageUrl = "";
        if (segmentImageFile) {
          segImageUrl = await uploadToS3(segmentImageFile, `blogs/segments`);
        }

        return {
          ...segment,
          seg_img: segImageUrl,
        };
      })
    );

    const blog = {
      _id: new ObjectId(),
      title,
      brief,
      title_image: titleImageUrl,
      segments: enrichedSegments,
      created_at: new Date(),
    };

    const updateResult = await db
      .collection("data")
      .updateOne(
        { _id: new ObjectId(process.env.MONGODB_OBJECT_ID) },
        { $push: { blogs: blog } as any },
        { upsert: true }
      );

    if (!updateResult.modifiedCount && !updateResult.upsertedCount) {
      throw new Error("Failed to update the blogs array in the data object.");
    }

    return NextResponse.json(
      { message: "Blog added successfully", data: blog },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      {
        error: "Failed to create blog",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
