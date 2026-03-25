import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_SIMPLE_API_BASE_URL || 'http://localhost:8050';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    const res = await fetch(`${BACKEND}/auth/me`, {
      headers: { Authorization: auth },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: 'Backend unavailable' }, { status: 502 });
  }
}
