import { NextRequest } from 'next/server';
import { proxy } from '../../_proxy';
export async function GET(req: NextRequest) { return proxy(req, '/settings/profile'); }
export async function PATCH(req: NextRequest) { return proxy(req, '/settings/profile', 'PATCH'); }