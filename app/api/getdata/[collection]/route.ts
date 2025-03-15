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

export async function GET(
  req: Request,
  { params }: { params: { collection: string } }
) {
  const collection = params.collection;
  try {
    if (!collection) {
      return NextResponse.json(
        { error: "Collection parameter is missing" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { db } = await connectToDatabase();
    const validCollections = ["blogs", "tags", "careers", "categories"];
    if (!validCollections.includes(collection)) {
      return NextResponse.json(
        { error: "Invalid collection requested" },
        { status: 400, headers: corsHeaders }
      );
    }

    const data = await db.collection(collection).find().toArray();
    return NextResponse.json({ data }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error(`Error fetching data from ${params.collection}:`, error);
    return NextResponse.json(
      {
        error: `Failed to fetch ${params.collection}`,
        details: (error as Error).message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
