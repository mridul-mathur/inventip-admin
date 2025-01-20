import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { uploadToS3, deleteFromS3 } from "@/lib/aws";

interface Career {
  _id: ObjectId;
  position: string;
  location: string;
  duration: string;
  pay: string;
  job_desc: string;
  skills: string[];
  file_url?: string;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();

    const position = formData.get("position") as string;
    const location = formData.get("location") as string;
    const duration = formData.get("duration") as string;
    const pay = formData.get("pay") as string;
    const job_desc = formData.get("job_desc") as string;
    const skills = (formData.get("skills") as string)
      .split(",")
      .map((skill) => skill.trim());
    const pdfFile = formData.get("pdfFile") as Blob | null;

    if (
      !position ||
      !location ||
      !duration ||
      !pay ||
      !job_desc ||
      !skills.length
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let file_url = "";
    if (pdfFile) {
      file_url = await uploadToS3(pdfFile, "careers");
    }

    const career: Career = {
      _id: new ObjectId(),
      position,
      location,
      duration,
      pay,
      job_desc,
      skills,
      file_url,
    };

    const { db } = await connectToDatabase();

    const result = await db
      .collection("data")
      .updateOne({}, { $push: { careers: career } as any }, { upsert: true });

    if (!result.acknowledged) {
      throw new Error("Failed to update careers in the database");
    }

    return NextResponse.json(
      { message: "Career added successfully", id: career._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/careers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const careerId = url.searchParams.get("id");

    if (!careerId || !ObjectId.isValid(careerId)) {
      return NextResponse.json({ error: "Invalid career ID" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const career = await db
      .collection("data")
      .findOne(
        { "careers._id": new ObjectId(careerId) },
        { projection: { "careers.$": 1 } }
      );

    if (!career || !career.careers || !career.careers[0]) {
      return NextResponse.json({ error: "Career not found" }, { status: 404 });
    }

    const file_url = career.careers[0].file_url;
    if (file_url) {
      const fileKey = file_url.split("/careers/")[1];
      if (fileKey) {
        await deleteFromS3(`careers/${fileKey}`);
      }
    }

    const result = await db
      .collection("data")
      .updateOne(
        {},
        { $pull: { careers: { _id: new ObjectId(careerId) } } as any }
      );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Career not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Career deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/careers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
