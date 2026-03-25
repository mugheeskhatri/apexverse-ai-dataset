import { NextRequest, NextResponse } from 'next/server';

const B = process.env.BACKEND_SIMPLE_API_BASE_URL || 'http://backend:8050';

export async function proxy(req: NextRequest, path: string, method?: string) {
  try {
    const auth = req.headers.get('authorization') || '';
    const m = method || req.method;
    const hasBody = ['POST','PUT','PATCH'].includes(m);
    let body: string | undefined;
    if (hasBody) {
      try { body = JSON.stringify(await req.json()); } catch { body = undefined; }
    }
    const res = await fetch(`${B}${path}`, {
      method: m,
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      ...(body ? { body } : {}),
    });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      // Normalize detail — backend sometimes returns {code, message} object
      // Frontend expects detail to always be a string
      if (data?.detail && typeof data.detail === 'object') {
        data.detail = data.detail.message || JSON.stringify(data.detail);
      }
      return NextResponse.json(data, { status: res.status });
    }
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ detail: `Service temporarily unavailable` }, { status: 502 });
  }
}
