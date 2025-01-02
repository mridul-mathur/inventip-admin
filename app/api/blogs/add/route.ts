import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { uploadToS3 } from "@/lib/aws";
import { z } from "zod";

const blogSchema = z.object({
  title: z.string().min(1),
  brief: z.string().min(1),
  segments: z.array(
    z.object({
      head: z.string().min(1),
      subhead: z.string().optional(),
      content: z.string().min(1),
      image: z.string().optional(),
    })
  ),
});

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const brief = formData.get("brief") as string;
    const titleImage = formData.get("titleImage");
    const segments = JSON.parse(formData.get("segments") as string);

    const validationResult = blogSchema.safeParse({ title, brief, segments });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.message },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    let titleImageUrl = "";
    if (titleImage instanceof Blob) {
      titleImageUrl = await uploadToS3(titleImage, "blogs/titles");
    }

    const enrichedSegments = await Promise.all(
      segments.map(async (segment: any, index: number) => {
        const segmentImage = formData.get(`segments[${index}][image]`);
        if (segmentImage instanceof Blob) {
          const imageUrl = await uploadToS3(segmentImage, `blogs/segments`);
          return { ...segment, image: imageUrl };
        }
        return segment;
      })
    );

    const blog = {
      title,
      brief,
      titleImage: titleImageUrl,
      segments: enrichedSegments,
    };

    await db.collection("blogs").insertOne(blog);

    return NextResponse.json({ message: "Blog created successfully", blog });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to create blog", details: (error as Error).message },
      { status: 500 }
    );
  }
}
