import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '../../_proxy';
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy(req, `/projects/${id}`);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy(req, `/projects/${id}`, 'PATCH');
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy(req, `/projects/${id}`, 'DELETE');
}