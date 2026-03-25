import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_SIMPLE_API_BASE_URL || 'http://localhost:8050';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const response = NextResponse.json(data, { status: res.status });
    // Forward refresh token cookie from backend
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) response.headers.set('set-cookie', setCookie);
    return response;
  } catch (err) {
    return NextResponse.json({ detail: 'Backend unavailable' }, { status: 502 });
  }
}
