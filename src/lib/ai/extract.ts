import "server-only";
import type { ParsedEmail } from "@/lib/email/message";
import { chatCompletionsJson } from "@/lib/ai/provider";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/constants";

export type EmailEventType =
  | "APPLICATION_CONFIRMATION"
  | "INTERVIEW"
  | "ASSESSMENT"
  | "OFFER"
  | "REJECTION"
  | "FOLLOW_UP"
  | "OTHER";

export const EMAIL_EVENT_TYPES: EmailEventType[] = [
  "APPLICATION_CONFIRMATION",
  "INTERVIEW",
  "ASSESSMENT",
  "OFFER",
  "REJECTION",
  "FOLLOW_UP",
  "OTHER",
];

export interface EmailExtraction {
  company: string | null;
  role: string | null;
  eventType: EmailEventType;
  eventDate: string | null;
  deadline: string | null;
  actionItem: string | null;
  suggestedStatus: ApplicationStatus | null;
  summary: string | null;
  confidence: number;
}

function asNullableString(value: unknown, max = 200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function asNullableDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function clampConfidence(value: unknown): number {
  const n = Number(value);
  if (Number.isNaN(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

function asEventType(value: unknown): EmailEventType {
  const eventType = typeof value === "string" ? value.toUpperCase() : "";
  return (EMAIL_EVENT_TYPES as string[]).includes(eventType)
    ? (eventType as EmailEventType)
    : "OTHER";
}

function asApplicationStatus(value: unknown): ApplicationStatus | null {
  const status = typeof value === "string" ? value.toUpperCase() : "";
  return (APPLICATION_STATUSES as readonly string[]).includes(status)
    ? (status as ApplicationStatus)
    : null;
}

export function validateExtraction(raw: unknown): EmailExtraction {
  const obj = (raw ?? {}) as Record<string, unknown>;

  return {
    company: asNullableString(obj.company),
    role: asNullableString(obj.role),
    eventType: asEventType(obj.eventType),
    eventDate: asNullableDate(obj.eventDate),
    deadline: asNullableDate(obj.deadline),
    actionItem: asNullableString(obj.actionItem, 500),
    suggestedStatus: asApplicationStatus(obj.suggestedStatus),
    summary: asNullableString(obj.summary, 500),
    confidence: clampConfidence(obj.confidence),
  };
}

export async function extractEmail(email: ParsedEmail): Promise<EmailExtraction> {
  const raw = await chatCompletionsJson([
    {
      role: "system",
      content:
        'You extract structured data from a job application email. ' +
        'Reply with strict JSON only using this schema: ' +
        '{"company": string|null, "role": string|null, "eventType": one of ' +
        'APPLICATION_CONFIRMATION|INTERVIEW|ASSESSMENT|OFFER|REJECTION|FOLLOW_UP|OTHER, ' +
        '"eventDate": ISO date string|null (date of the event/interview/assessment), ' +
        '"deadline": ISO date string|null (deadline to reply or complete something), ' +
        '"actionItem": string|null (one concrete action the user must take, e.g. "Complete coding assessment by July 20"), ' +
        '"suggestedStatus": one of APPLIED|ASSESSMENT|INTERVIEW|OFFER|REJECTED|WITHDRAWN|null, ' +
        '"summary": string (1 sentence), "confidence": number 0-1}. ' +
        'Use null when information is not present. Prefer company/role extracted from the email, fall back to sender domain when needed.',
    },
    {
      role: "user",
      content: `Subject: ${email.subject}\nFrom: ${email.from}\nDate: ${email.date ?? "unknown"}\n\nBody:\n${email.body.slice(0, 4000)}`,
    },
  ]);

  return validateExtraction(raw);
}