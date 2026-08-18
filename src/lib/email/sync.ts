import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getConnectionWithValidToken, listGmailMessages, getGmailMessage } from "@/lib/gmail/client";
import { parseGmailMessage, type ParsedEmail } from "@/lib/email/message";
import { isEmailCandidate } from "@/lib/email/filter";
import { classifyEmail } from "@/lib/ai/classify";
import { extractEmail, type EmailExtraction } from "@/lib/ai/extract";
import { AiNotConfiguredError } from "@/lib/ai/provider";

export interface SyncResult {
  scanned: number;
  candidates: number;
  inserted: number;
  jobRelated: number;
  errors: number;
  message: string;
}

const MAX_SCAN = 50;
const MAX_AI_CANDIDATES = 25;

function buildEventRow(
  userId: string,
  email: ParsedEmail,
  classification: { isJobRelated: boolean; confidence: number; reason: string },
  extraction: EmailExtraction | null,
) {
  return {
    user_id: userId,
    gmail_message_id: email.messageId,
    gmail_thread_id: email.threadId,
    event_type: extraction?.eventType ?? null,
    subject: email.subject,
    sender: email.senderEmail,
    extracted_data: {
      isJobRelated: classification.isJobRelated,
      reason: classification.reason,
      classificationConfidence: classification.confidence,
      extraction,
    },
    confidence: extraction?.confidence ?? classification.confidence,
    received_at: email.date ?? new Date().toISOString(),
  };
}

export async function syncGmailEmails(
  supabase: SupabaseClient,
  userId: string,
): Promise<SyncResult> {
  const { connection, accessToken } = await getConnectionWithValidToken(
    supabase,
    userId,
  );

  if (!connection || !accessToken) {
    return {
      scanned: 0,
      candidates: 0,
      inserted: 0,
      jobRelated: 0,
      errors: 0,
      message: "Gmail is not connected. Connect Gmail first.",
    };
  }

  const result: SyncResult = {
    scanned: 0,
    candidates: 0,
    inserted: 0,
    jobRelated: 0,
    errors: 0,
    message: "",
  };

  let aiConfigured = true;
  try {
    const list = await listGmailMessages(accessToken, undefined, MAX_SCAN);

    const messages = (list.messages ?? []).slice(0, MAX_SCAN);
    result.scanned = messages.length;

    if (messages.length > 0) {
      const ids = messages.map((m) => m.id);
      const { data: existing } = await supabase
        .from("OS_Email_Events")
        .select("gmail_message_id")
        .in("gmail_message_id", ids);

      const existingIds = new Set(
        (existing ?? []).map((e: { gmail_message_id: string }) => e.gmail_message_id),
      );

      const fresh = messages.filter((m) => !existingIds.has(m.id));

      const candidates: ParsedEmail[] = [];

      for (const messageMeta of fresh.slice(0, MAX_SCAN)) {
        try {
          const full = await getGmailMessage(accessToken, messageMeta.id);
          const parsed = parseGmailMessage(full);
          if (isEmailCandidate(parsed).isCandidate) {
            candidates.push(parsed);
          }
        } catch {
          result.errors += 1;
        }
      }

      result.candidates = candidates.length;

      const toAnalyze = candidates.slice(0, MAX_AI_CANDIDATES);
      const rows: Record<string, unknown>[] = [];

      for (const candidate of toAnalyze) {
        try {
          const classification = await classifyEmail(candidate);

          let extraction: EmailExtraction | null = null;
          if (classification.isJobRelated) {
            extraction = await extractEmail(candidate);
            result.jobRelated += 1;
          }

          rows.push(
            buildEventRow(userId, candidate, classification, extraction),
          );
        } catch {
          result.errors += 1;
        }
      }

      if (rows.length > 0) {
        const { error } = await supabase.from("OS_Email_Events").insert(rows);
        if (error) {
          result.errors += 1;
        } else {
          result.inserted = rows.length;
        }
      }
    }
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      aiConfigured = false;
    } else {
      result.errors += 1;
      result.message = (error as Error).message;
    }
  }

  if (!aiConfigured) {
    result.message =
      "AI provider not configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY.";
  } else if (!result.message) {
    result.message = `Scanned ${result.scanned} emails, ${result.inserted} new event${result.inserted === 1 ? "" : "s"} stored (${result.jobRelated} job-related).`;
  }

  return result;
}