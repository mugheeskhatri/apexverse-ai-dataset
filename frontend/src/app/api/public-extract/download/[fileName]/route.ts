import { NextRequest, NextResponse } from "next/server";

const APEXCRAWL_URL = process.env.APEXCRAWL_URL || "http://localhost:8060";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  const { fileName } = await params;
  const response = await fetch(
    `${APEXCRAWL_URL}/public/downloads/${encodeURIComponent(fileName)}`,
    { cache: "no-store" }
  ).catch(() => null);

  if (!response || !response.ok) {
    return NextResponse.json({ detail: "Export not found." }, { status: 404 });
  }

  const data = await response.arrayBuffer();
  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
