import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { uploadToS3, deleteFromS3 } from "@/lib/aws";
import { ObjectId } from "mongodb";

export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const blogId = formData.get("id") as string;

    if (!blogId) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const blogEntry = await db
      .collection("data")
      .findOne(
        { "blogs._id": new ObjectId(blogId) },
        { projection: { "blogs.$": 1 } }
      );

    if (!blogEntry || !blogEntry.blogs || blogEntry.blogs.length === 0) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const existingBlog = blogEntry.blogs[0];
    const updatedFields: any = {};
    const title = formData.get("title") as string;
    const brief = formData.get("brief") as string;

    if (title && title !== existingBlog.title) {
      updatedFields["blogs.$.title"] = title;
    }

    if (brief && brief !== existingBlog.brief) {
      updatedFields["blogs.$.brief"] = brief;
    }

    const titleImageFile = formData.get("titleImage") as Blob | null;
    if (titleImageFile) {
      const newTitleImageUrl = await uploadToS3(titleImageFile, "blogs/titles");
      if (
        existingBlog.title_image &&
        !existingBlog.title_image.includes("placeholder")
      ) {
        await deleteFromS3(existingBlog.title_image);
      }
      updatedFields["blogs.$.title_image"] = newTitleImageUrl;
    }

    const updatedSegments = [];
    for (let i = 0; ; i++) {
      const heading = formData.get(`segments[${i}][heading]`);
      if (!heading) break;

      const subheading = formData.get(`segments[${i}][subheading]`) as string;
      const content = formData.get(`segments[${i}][content]`) as string;

      const imageFile = formData.get(`segments[${i}][image]`) as Blob | null;
      let segImgUrl = "none";

      if (imageFile) {
        segImgUrl = await uploadToS3(imageFile, "blogs/segments");
        if (
          existingBlog.segments?.[i]?.seg_img &&
          !existingBlog.segments[i].seg_img.includes("placeholder")
        ) {
          await deleteFromS3(existingBlog.segments[i].seg_img);
        }
      } else if (existingBlog.segments?.[i]?.seg_img) {
        segImgUrl = existingBlog.segments[i].seg_img;
      }

      updatedSegments.push({
        head: heading,
        subhead: subheading,
        content,
        seg_img: segImgUrl,
      });
    }

    const existingSegmentIds = existingBlog.segments.map(
      (seg: any) => seg.seg_img
    );
    const updatedSegmentIds = updatedSegments.map((seg) => seg.seg_img);

    const deletedSegmentImages = existingSegmentIds.filter(
      (img: any) => img && !updatedSegmentIds.includes(img)
    );

    for (const img of deletedSegmentImages) {
      if (img !== "none" && !img.includes("placeholder")) {
        await deleteFromS3(img);
      }
    }

    updatedFields["blogs.$.segments"] = updatedSegments;

    if (Object.keys(updatedFields).length > 0) {
      const result = await db
        .collection("data")
        .updateOne(
          { "blogs._id": new ObjectId(blogId) },
          { $set: updatedFields }
        );

      if (result.modifiedCount === 0) {
        throw new Error("Failed to update the blog.");
      }
    }

    return NextResponse.json(
      { message: "Blog updated successfully", updatedFields },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      {
        error: "Failed to update blog",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const blogId = searchParams.get("id");

  if (!blogId) {
    return NextResponse.json({ error: "Blog ID is required" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const blog = await db
      .collection("data")
      .findOne(
        { "blogs._id": new ObjectId(blogId) },
        { projection: { "blogs.$": 1 } }
      );

    if (!blog || !blog.blogs || blog.blogs.length === 0) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(blog.blogs[0], { status: 200 });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch blog",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
