import "server-only";
import { chatCompletionsJson } from "@/lib/ai/provider";
import type { EmailExtraction } from "@/lib/ai/extract";

export interface ApplicationSummary {
  id: string;
  company: string;
  role: string;
  status: string;
}

export interface AiMatch {
  applicationId: string | null;
  confidence: number;
  reason: string;
}

function clampConfidence(value: unknown): number {
  const n = Number(value);
  if (Number.isNaN(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

export function validateAiMatch(
  raw: unknown,
  validIds: string[],
): AiMatch {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const rawId = typeof obj.applicationId === "string" ? obj.applicationId : null;

  return {
    applicationId: rawId && validIds.includes(rawId) ? rawId : null,
    confidence: clampConfidence(obj.confidence),
    reason: typeof obj.reason === "string" ? obj.reason.slice(0, 300) : "",
  };
}

export async function matchApplicationAi(
  extraction: EmailExtraction,
  senderDomain: string,
  applications: ApplicationSummary[],
): Promise<AiMatch> {
  const raw = await chatCompletionsJson([
    {
      role: "system",
      content:
        'You match a job application email event to one of the user\'s existing job applications. ' +
        'Reply with strict JSON only: {"applicationId": string|null, "confidence": number 0-1, "reason": string}. ' +
        'Pick an application only if you are reasonably confident it corresponds to this email. ' +
        'Prefer exact company/role matches. Use null if no application fits. Confidence reflects how sure you are.',
    },
    {
      role: "user",
      content:
        `Email event:\n` +
        `Company: ${extraction.company ?? "unknown"}\n` +
        `Role: ${extraction.role ?? "unknown"}\n` +
        `Event type: ${extraction.eventType}\n` +
        `Summary: ${extraction.summary ?? "none"}\n` +
        `Sender domain: ${senderDomain}\n\n` +
        `Existing applications:\n` +
        applications
          .map(
            (app) =>
              `- id: ${app.id} | company: ${app.company} | role: ${app.role} | status: ${app.status}`,
          )
          .join("\n"),
    },
  ]);

  return validateAiMatch(
    raw,
    applications.map((app) => app.id),
  );
}