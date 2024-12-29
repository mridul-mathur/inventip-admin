import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    console.log("Connected to database.");

    const result = await db
      .collection("data")
      .findOne({}, { projection: { _id: 0 } });

    if (!result) {
      console.error("No data found in the collection.");
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data", details: (error as any).message },
      { status: 500 }
    );
  }
}
