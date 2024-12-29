import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface Career {
  _id: ObjectId;
  position: string;
  location: string;
  duration: string;
  pay: string;
  job_desc: string;
  skills: string[];
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();

    const { position, location, duration, pay, job_desc, skills } = body;

    if (
      !position ||
      !location ||
      !duration ||
      !pay ||
      !job_desc ||
      !Array.isArray(skills) ||
      skills.some((skill) => typeof skill !== "string")
    ) {
      return NextResponse.json(
        { error: "Invalid data provided" },
        { status: 400 }
      );
    }

    const career: Career = {
      _id: new ObjectId(),
      position,
      location,
      duration,
      pay,
      job_desc,
      skills,
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
