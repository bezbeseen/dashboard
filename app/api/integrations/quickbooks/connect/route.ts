import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { buildQuickBooksAuthorizationUrl } from '@/lib/quickbooks/oauth';

export async function GET() {
  const state = crypto.randomBytes(24).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set('qb_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  });

  const url = buildQuickBooksAuthorizationUrl(state);
  return NextResponse.redirect(url);
}
