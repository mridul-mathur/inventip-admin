import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS, PUT",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders });
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const data = await db.collection("blogs").find().toArray();
    return NextResponse.json({ data }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch blogs",
        details: (error as Error).message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
