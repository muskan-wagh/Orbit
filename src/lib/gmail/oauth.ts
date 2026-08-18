import "server-only";

const GMAIL_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

function requireEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI",
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildGmailAuthUrl(state: string): string {
  const { clientId, redirectUri } = requireEnv();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GMAIL_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GMAIL_AUTH_URL}?${params.toString()}`;
}

async function postToken(
  body: URLSearchParams,
): Promise<TokenResponse> {
  const { clientId, clientSecret, redirectUri } = requireEnv();
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("redirect_uri", redirectUri);

  const res = await fetch(GMAIL_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Google OAuth error ${res.status}: ${
        data?.error_description ?? data?.error ?? "unknown"
      }`,
    );
  }

  return data as TokenResponse;
}

export function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  return postToken(
    new URLSearchParams({ code, grant_type: "authorization_code" }),
  );
}

export function refreshGmailAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  return postToken(
    new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  );
}