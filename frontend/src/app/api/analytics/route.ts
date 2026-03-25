import { NextRequest } from 'next/server';
import { proxy } from '../_proxy';
export async function GET(req: NextRequest) {
  const range = req.nextUrl.searchParams.get('range') || '7d';
  return proxy(req, `/analytics?range=${range}`);
}