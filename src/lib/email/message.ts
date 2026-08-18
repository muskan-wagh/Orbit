import "server-only";
import type { GmailMessage, GmailMessageHeader, GmailMessagePart } from "@/lib/gmail/client";

export interface ParsedEmail {
  messageId: string;
  threadId: string;
  subject: string;
  from: string;
  senderEmail: string;
  senderDomain: string;
  date: string | null;
  body: string;
}

function decodeBase64Url(data: string): string {
  const normalized = data
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .replace(/=+$/, "");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf-8");
}

function getHeader(headers: GmailMessageHeader[] | undefined, name: string): string {
  const match = headers?.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase(),
  );
  return match?.value ?? "";
}

function extractBodyText(message: GmailMessage): string {
  const payload = message.payload;
  if (!payload) return "";

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  const parts = payload.parts ?? [];

  const plain = parts.find((p) => p.mimeType === "text/plain" && p.body?.data);
  if (plain?.body?.data) {
    return decodeBase64Url(plain.body.data);
  }

  const queue: GmailMessagePart[] = [...parts];
  while (queue.length > 0) {
    const part = queue.shift()!;
    if (part.mimeType === "text/plain" && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
    if (part.parts) {
      queue.push(...part.parts);
    }
  }

  return "";
}

function parseSenderEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match?.[1]?.trim() ?? from.trim();
}

export function parseGmailMessage(message: GmailMessage): ParsedEmail {
  const subject = getHeader(message.payload?.headers, "Subject");
  const from = getHeader(message.payload?.headers, "From");
  const date = getHeader(message.payload?.headers, "Date");
  const senderEmail = parseSenderEmail(from);
  const senderDomain = senderEmail.includes("@")
    ? senderEmail.split("@")[1].toLowerCase()
    : "";

  const body = extractBodyText(message).replace(/\r\n/g, "\n");

  return {
    messageId: message.id,
    threadId: message.threadId,
    subject,
    from,
    senderEmail,
    senderDomain,
    date: date || null,
    body,
  };
}