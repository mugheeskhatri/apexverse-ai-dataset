import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_SIMPLE_API_BASE_URL || 'http://localhost:8050';

export async function POST(req: NextRequest) {
  try {
    await fetch(`${BACKEND}/auth/logout`, { method: 'POST' });
    const response = NextResponse.json({ ok: true });
    response.cookies.delete('refresh_token');
    return response;
  } catch {
    return NextResponse.json({ ok: true });
  }
}
