import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { refreshGmailAccessToken } from "@/lib/gmail/oauth";

const GMAIL_API_URL = "https://gmail.googleapis.com/gmail/v1";

export interface GmailProfile {
  emailAddress: string;
  messagesTotal?: number;
  threadsTotal?: number;
  historyId?: string;
}

export interface GmailMessageList {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessagePart {
  mimeType?: string;
  body?: { size?: number; data?: string };
  parts?: GmailMessagePart[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  internalDate: string;
  snippet: string;
  payload?: {
    headers?: GmailMessageHeader[];
    mimeType?: string;
    body?: { size?: number; data?: string };
    parts?: GmailMessagePart[];
  };
}

export class GmailUnauthorizedError extends Error {
  constructor() {
    super("Gmail access token is invalid or expired");
    this.name = "GmailUnauthorizedError";
  }
}

async function gmailFetch<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${GMAIL_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new GmailUnauthorizedError();
  }

  if (!res.ok) {
    throw new Error(`Gmail API error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}

export function getGmailProfile(accessToken: string): Promise<GmailProfile> {
  return gmailFetch<GmailProfile>(accessToken, "/users/me/profile");
}

export function listGmailMessages(
  accessToken: string,
  query?: string,
  maxResults = 20,
  pageToken?: string,
): Promise<GmailMessageList> {
  const params = new URLSearchParams({ maxResults: String(maxResults) });
  if (query) params.set("q", query);
  if (pageToken) params.set("pageToken", pageToken);
  return gmailFetch<GmailMessageList>(
    accessToken,
    `/users/me/messages?${params.toString()}`,
  );
}

export function getGmailMessage(
  accessToken: string,
  id: string,
): Promise<GmailMessage> {
  return gmailFetch<GmailMessage>(accessToken, `/users/me/messages/${id}`);
}

interface GmailConnectionRow {
  access_token: string | null;
  refresh_token: string | null;
  token_expiry: string | null;
}

export async function getConnectionWithValidToken(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ connection: GmailConnectionRow | null; accessToken: string | null }> {
  const { data: connection } = await supabase
    .from("OS_Gmail_Connections")
    .select("access_token, refresh_token, token_expiry")
    .eq("user_id", userId)
    .maybeSingle();

  if (!connection) {
    return { connection: null, accessToken: null };
  }

  if (!connection.refresh_token) {
    return { connection, accessToken: connection.access_token };
  }

  const expiry = connection.token_expiry
    ? new Date(connection.token_expiry).getTime()
    : 0;

  if (expiry > Date.now() + 60_000) {
    return { connection, accessToken: connection.access_token };
  }

  const tokens = await refreshGmailAccessToken(connection.refresh_token);
  await supabase
    .from("OS_Gmail_Connections")
    .update({
      access_token: tokens.access_token,
      token_expiry: new Date(
        Date.now() + tokens.expires_in * 1000,
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return { connection, accessToken: tokens.access_token };
}