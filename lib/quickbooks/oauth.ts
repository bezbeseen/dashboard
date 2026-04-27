export type IntuitTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in?: number;
  token_type?: string;
};

const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const AUTHORIZE_URL = 'https://appcenter.intuit.com/connect/oauth2';

function trimEnv(key: 'QUICKBOOKS_CLIENT_ID' | 'QUICKBOOKS_CLIENT_SECRET'): string | undefined {
  const t = process.env[key]?.trim();
  return t ? t : undefined;
}

/** True if missing or a common mistaken placeholder (e.g. literal "undefined" from bad env injection). */
function isInvalidClientCredentialValue(v: string | undefined): boolean {
  if (v == null) return true;
  const lower = v.toLowerCase();
  return (
    lower === 'undefined' ||
    lower === 'null' ||
    lower === 'replace-me' ||
    lower === 'replace_me' ||
    lower === 'your-client-id' ||
    lower === 'your-client-secret'
  );
}

/** Use in env-check / UI: real Intuit keys present (not empty or placeholder strings). */
export function quickBooksOAuthCredentialsConfigured(): boolean {
  const clientId = trimEnv('QUICKBOOKS_CLIENT_ID');
  const clientSecret = trimEnv('QUICKBOOKS_CLIENT_SECRET');
  return !isInvalidClientCredentialValue(clientId) && !isInvalidClientCredentialValue(clientSecret);
}

function requireClientCreds(): { clientId: string; clientSecret: string } {
  const clientId = trimEnv('QUICKBOOKS_CLIENT_ID');
  const clientSecret = trimEnv('QUICKBOOKS_CLIENT_SECRET');
  if (isInvalidClientCredentialValue(clientId) || isInvalidClientCredentialValue(clientSecret)) {
    throw new Error('QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET must be set');
  }
  return { clientId: clientId as string, clientSecret: clientSecret as string };
}

export function buildQuickBooksAuthorizationUrl(state: string, redirectUri: string): string {
  const { clientId } = requireClientCreds();
  if (!redirectUri.trim()) {
    throw new Error('QuickBooks redirect URI is empty');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: redirectUri,
    state,
  });

  return `${AUTHORIZE_URL}?${params.toString()}`;
}

async function postToken(body: URLSearchParams): Promise<IntuitTokenResponse> {
  const { clientId, clientSecret } = requireClientCreds();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Intuit token endpoint error ${res.status}: ${text}`);
  }
  return JSON.parse(text) as IntuitTokenResponse;
}

export async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string
): Promise<IntuitTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
  return postToken(body);
}

export async function refreshQuickBooksAccessToken(
  refreshToken: string
): Promise<IntuitTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  return postToken(body);
}
