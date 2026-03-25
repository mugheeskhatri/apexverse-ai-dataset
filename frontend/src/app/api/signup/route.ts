// Next.js App Router API route to proxy signup requests to FastAPI backend
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Adjust backend URL if needed (use docker network name if running in Docker Compose)
    // Dynamically choose backend URL based on environment
    let backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      // If running in Docker, host header will not be localhost
      const host = req.headers.get('host') || '';
      if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
        backendUrl = 'http://localhost:8050/signup';
      } else {
        backendUrl = 'http://backend:8050/signup';
      }
    }
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ detail: 'Signup failed. Please try again.' }, { status: 500 });
  }
}
