import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Public extract calls ApexCrawl directly (port 8060) — not the main backend
const APEXCRAWL_URL = process.env.APEXCRAWL_URL || "http://localhost:8060";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  const response = await fetch(`${APEXCRAWL_URL}/public/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  }).catch(() => null);

  if (!response) {
    return NextResponse.json(
      { detail: "Service is temporarily unavailable. Please try again later." },
      { status: 502 },
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    return NextResponse.json(
      { detail: payload?.detail ?? "Extraction failed." },
      { status: response.status || 502 },
    );
  }

  return NextResponse.json({
    ...payload,
    export: {
      ...payload.export,
      // Rewrite download URL to go through our proxy
      download_url: `/api/public-extract/download/${encodeURIComponent(payload.export.filename)}`,
    },
  });
}
