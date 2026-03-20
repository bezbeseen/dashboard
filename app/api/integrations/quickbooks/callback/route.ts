import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { exchangeAuthorizationCode } from '@/lib/quickbooks/oauth';
import { upsertQuickBooksTokens } from '@/lib/quickbooks/tokens-db';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const expectedState = cookieStore.get('qb_oauth_state')?.value;
  const state = req.nextUrl.searchParams.get('state');

  if (!expectedState || !state || state !== expectedState) {
    return NextResponse.json({ error: 'Invalid or missing OAuth state. Start again from Connect QuickBooks.' }, { status: 400 });
  }

  cookieStore.delete('qb_oauth_state');

  const oauthError = req.nextUrl.searchParams.get('error');
  if (oauthError) {
    return NextResponse.json(
      {
        error: oauthError,
        description: req.nextUrl.searchParams.get('error_description'),
      },
      { status: 400 }
    );
  }

  const code = req.nextUrl.searchParams.get('code');
  const realmId = req.nextUrl.searchParams.get('realmId');
  if (!code || !realmId) {
    return NextResponse.json({ error: 'Missing code or realmId from QuickBooks redirect.' }, { status: 400 });
  }

  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
  if (!redirectUri) {
    return NextResponse.json({ error: 'QUICKBOOKS_REDIRECT_URI is not set.' }, { status: 500 });
  }

  try {
    const tokens = await exchangeAuthorizationCode(code, redirectUri);
    await upsertQuickBooksTokens({
      realmId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresInSeconds: tokens.expires_in,
      refreshExpiresInSeconds: tokens.x_refresh_token_expires_in,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Token exchange failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return NextResponse.redirect(new URL('/dashboard?qb_connected=1', base));
}
