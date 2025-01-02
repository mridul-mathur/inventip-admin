import { connectToDatabase } from "@/lib/mongodb";

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    console.log("Connected to database.");

    const result = await db
      .collection("data")
      .findOne({}, { projection: { _id: 0 } });

    if (!result) {
      console.error("No data found in the collection.");
      return new Response(JSON.stringify({ error: "No data found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch data",
        details: (error as any).message,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
