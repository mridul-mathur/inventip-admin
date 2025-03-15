import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { uploadToS3, deleteFromS3 } from "@/lib/aws";
import { ObjectId } from "mongodb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS, PUT",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders });
}

export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const blogId = formData.get("id") as string;

    if (!blogId) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { db } = await connectToDatabase();
    const blogEntry = await db
      .collection("blogs")
      .findOne({ _id: new ObjectId(blogId) });

    if (!blogEntry) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const updatedFields: any = {};
    const title = formData.get("title") as string;
    const brief = formData.get("brief") as string;

    if (title && title !== blogEntry.title) {
      updatedFields.title = title;
    }

    if (brief && brief !== blogEntry.brief) {
      updatedFields.brief = brief;
    }

    // ✅ Category handling added
    const categoryId = formData.get("category") as string;
    if (categoryId && categoryId !== blogEntry.category.toString()) {
      if (!ObjectId.isValid(categoryId)) {
        return NextResponse.json(
          { error: "Invalid category ID" },
          { status: 400, headers: corsHeaders }
        );
      }

      const categoryObject = new ObjectId(categoryId);
      const categoryExists = await db
        .collection("categories")
        .findOne({ _id: categoryObject });

      if (!categoryExists) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      updatedFields.category = categoryObject;
    }

    // Process tags
    const tagsEntries = formData.getAll("tags[]");
    if (tagsEntries.length > 0) {
      const tagIds = tagsEntries.map((tag) => {
        try {
          return new ObjectId(tag.toString());
        } catch {
          return tag.toString();
        }
      });
      updatedFields.tags = tagIds;
    }

    // Handling title image update
    const titleImageFile = formData.get("titleImage") as Blob | null;
    if (titleImageFile) {
      const newTitleImageUrl = await uploadToS3(titleImageFile, "blogs/titles");

      if (
        blogEntry.title_image &&
        !blogEntry.title_image.includes("placeholder")
      ) {
        await deleteFromS3(blogEntry.title_image);
      }

      updatedFields.title_image = newTitleImageUrl;
    }

    // Handling segments update
    const updatedSegments = [];
    for (let i = 0; ; i++) {
      const heading = formData.get(`segments[${i}][heading]`);
      if (!heading) break; // Exit loop if no heading found

      const subheading = formData.get(`segments[${i}][subheading]`) as string;
      const content = formData.get(`segments[${i}][content]`) as string;

      const imageFile = formData.get(`segments[${i}][image]`) as Blob | null;
      let segImgUrl = blogEntry.segments?.[i]?.seg_img || "none";

      if (imageFile) {
        segImgUrl = await uploadToS3(imageFile, "blogs/segments");
        if (
          blogEntry.segments?.[i]?.seg_img &&
          !blogEntry.segments[i].seg_img.includes("placeholder")
        ) {
          await deleteFromS3(blogEntry.segments[i].seg_img);
        }
      }

      updatedSegments.push({
        head: heading,
        subhead: subheading,
        content,
        seg_img: segImgUrl,
      });
    }

    // Deleting removed segment images
    const existingSegmentIds = blogEntry.segments.map(
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

    updatedFields.segments = updatedSegments;

    if (Object.keys(updatedFields).length > 0) {
      const result = await db
        .collection("blogs")
        .updateOne({ _id: new ObjectId(blogId) }, { $set: updatedFields });

      if (result.modifiedCount === 0) {
        throw new Error("Failed to update the blog.");
      }
    }

    return NextResponse.json(
      { message: "Blog updated successfully", updatedFields },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      {
        error: "Failed to update blog",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const blogId = searchParams.get("id");

  if (!blogId) {
    return NextResponse.json(
      { error: "Blog ID is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const { db } = await connectToDatabase();
    const blog = await db
      .collection("blogs")
      .findOne({ _id: new ObjectId(blogId) });

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(blog, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch blog",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}