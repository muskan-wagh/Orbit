import "server-only";
import type { ParsedEmail } from "@/lib/email/message";
import { chatCompletionsJson } from "@/lib/ai/provider";

export interface EmailClassification {
  isJobRelated: boolean;
  confidence: number;
  reason: string;
}

function clampConfidence(value: unknown): number {
  const n = Number(value);
  if (Number.isNaN(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

export function validateClassification(raw: unknown): EmailClassification {
  const obj = (raw ?? {}) as Record<string, unknown>;

  if (typeof obj.isJobRelated !== "boolean") {
    throw new Error("AI classification missing isJobRelated");
  }

  return {
    isJobRelated: obj.isJobRelated,
    confidence: clampConfidence(obj.confidence),
    reason: typeof obj.reason === "string" ? obj.reason.slice(0, 300) : "",
  };
}

export async function classifyEmail(email: ParsedEmail): Promise<EmailClassification> {
  const raw = await chatCompletionsJson([
    {
      role: "system",
      content:
        'You classify whether an email is related to a job application process. ' +
        'Reply with strict JSON only: {"isJobRelated": boolean, "confidence": number 0-1, "reason": string}. ' +
        'Job application emails include: application confirmations, interview invites, assessments, offers, rejections, recruiter outreach, follow-ups, onboarding. ' +
        'Do NOT include: newsletters, promotions, social notifications, spam, security codes, invoices, receipts, general company news.',
    },
    {
      role: "user",
      content: `Subject: ${email.subject}\nFrom: ${email.from}\nDate: ${email.date ?? "unknown"}\n\nBody:\n${email.body.slice(0, 4000)}`,
    },
  ]);

  return validateClassification(raw);
}