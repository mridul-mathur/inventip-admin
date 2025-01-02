import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { runMiddleware } from "@/lib/runMiddleware";
import { uploadMiddleware } from "@/lib/multer";
import s3 from "@/lib/aws";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Fetch a specific blog
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const blogData = await db
      .collection("data")
      .findOne({ "blogs._id": new ObjectId(id) });

    if (!blogData) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const blog = blogData.blogs.find((blog: any) => blog._id.toString() === id);
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(blog, { status: 200 });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog", details: (error as any).message },
      { status: 500 }
    );
  }
}

// Update a blog
export async function PUT(req: any, res: any) {
  try {
    await runMiddleware(req, res, uploadMiddleware);

    const { id, title, brief, titleImageOld, segments } = req.body;
    const files = req.files as Record<string, Express.Multer.File[]>;

    if (!id || !title) {
      return NextResponse.json(
        { error: "Missing required fields: id or title" },
        { status: 400 }
      );
    }
    if (!id || !brief) {
      return NextResponse.json(
        { error: "Missing required fields: id or brief" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    let titleImage = titleImageOld;
    if (files?.titleImage?.[0]) {
      const file = files.titleImage[0];
      const uploadResult = await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: `blogs/${Date.now()}-${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      titleImage = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadResult.Key}`;

      if (titleImageOld) {
        const oldKey = titleImageOld.split("/").pop();
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: oldKey!,
          })
        );
      }
    }

    let updatedSegments = [];
    if (segments) {
      const parsedSegments = JSON.parse(segments);
      updatedSegments = await Promise.all(
        parsedSegments.map(async (segment: any, index: number) => {
          const updatedSegment = { ...segment };

          const segmentImageKey = `segments[${index}][image]`;
          if (files?.[segmentImageKey]?.[0]) {
            const file = files[segmentImageKey][0];
            const uploadResult = await s3.send(
              new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: `blogs/segments/${Date.now()}-${file.originalname}`,
                Body: file.buffer,
                ContentType: file.mimetype,
              })
            );

            updatedSegment.seg_img = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadResult.Key}`;
          }

          return updatedSegment;
        })
      );
    }

    const updateFields: any = {
      "blogs.$.title": title,
      "blogs.$.brief": brief,
      "blogs.$.title_image": titleImage,
    };

    if (segments) {
      updateFields["blogs.$.segments"] = updatedSegments;
    }

    const result = await db
      .collection("data")
      .updateOne({ "blogs._id": new ObjectId(id) }, { $set: updateFields });

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Blog updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { error: "Failed to update blog", details: (error as any).message },
      { status: 500 }
    );
  }
}

// Delete a blog
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, titleImage } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Blog ID is required for deletion" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const result = await db
      .collection("data")
      .updateOne(
        { "blogs._id": new ObjectId(id) },
        { $pull: { blogs: { _id: new ObjectId(id) } } as any }
      );

    if (titleImage) {
      const key = titleImage.split("/").pop();
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: key!,
        })
      );
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
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
