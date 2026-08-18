import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  companyNamesMatch,
  domainMatchesCompany,
  rolesMatch,
  senderDomainFromEmail,
} from "@/lib/match/normalize";
import { matchApplicationAi, type ApplicationSummary } from "@/lib/ai/match";
import type { EmailExtraction } from "@/lib/ai/extract";
import type { ApplicationStatus } from "@/lib/constants";

const AUTO_THRESHOLD = 0.9;
const CONFIRM_THRESHOLD = 0.7;

export type MatchMethod = "thread" | "company" | "domain" | "ai";
export type MatchDecision = "auto" | "confirm" | "none";

export interface MatchingMeta {
  status: "matched" | "pending" | "dismissed" | "none";
  applicationId?: string | null;
  confidence?: number;
  reason?: string;
  method?: MatchMethod;
}

interface EventRow {
  id: string;
  user_id: string;
  application_id: string | null;
  gmail_thread_id: string | null;
  sender: string | null;
  extracted_data: {
    isJobRelated?: boolean;
    extraction?: EmailExtraction | null;
    matching?: MatchingMeta;
  } | null;
}

interface ApplicationRow {
  id: string;
  user_id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  applied_at: string | null;
}

export interface MatchSummary {
  processed: number;
  matched: number;
  pending: number;
  none: number;
  errors: number;
}

const PIPELINE_RANK: Record<string, number> = {
  APPLIED: 1,
  ASSESSMENT: 2,
  INTERVIEW: 3,
  OFFER: 4,
};

export function shouldApplyStatus(
  current: ApplicationStatus,
  suggested: ApplicationStatus,
): boolean {
  if (suggested === current) return false;
  if (suggested === "REJECTED") return current !== "OFFER";
  if (suggested === "WITHDRAWN") return false;
  const currentRank = PIPELINE_RANK[current] ?? 0;
  const suggestedRank = PIPELINE_RANK[suggested] ?? 0;
  return suggestedRank > currentRank;
}

async function applySuggestedStatus(
  supabase: SupabaseClient,
  application: ApplicationRow,
  event: EventRow,
): Promise<void> {
  const extraction = event.extracted_data?.extraction;
  const suggestedStatus = extraction?.suggestedStatus;
  if (!suggestedStatus || !shouldApplyStatus(application.status, suggestedStatus)) {
    return;
  }

  const updates: Record<string, unknown> = {
    status: suggestedStatus,
    updated_at: new Date().toISOString(),
  };

  if (
    suggestedStatus === "APPLIED" &&
    !application.applied_at &&
    event.extracted_data?.extraction?.eventType === "APPLICATION_CONFIRMATION"
  ) {
    updates.applied_at = new Date().toISOString();
  }

  await supabase
    .from("OS_Applications")
    .update(updates)
    .eq("id", application.id)
    .eq("user_id", application.user_id);
}

interface DeterministicCandidate {
  application: ApplicationRow;
  confidence: number;
  method: MatchMethod;
}

function findDeterministicCandidates(
  extraction: EmailExtraction,
  senderDomain: string,
  applications: ApplicationRow[],
): DeterministicCandidate[] {
  const candidates: DeterministicCandidate[] = [];

  const company = extraction.company?.trim();
  const role = extraction.role?.trim();

  if (company) {
    const companyMatches = applications.filter((app) =>
      companyNamesMatch(app.company, company),
    );

    if (companyMatches.length === 1) {
      const app = companyMatches[0];
      let confidence = 0.9;
      if (role && rolesMatch(app.role, role)) confidence += 0.05;
      if (senderDomain && domainMatchesCompany(senderDomain, app.company)) {
        confidence += 0.04;
      }
      candidates.push({
        application: app,
        confidence: Math.min(0.98, confidence),
        method: "company",
      });
    } else if (companyMatches.length > 1) {
      let best: DeterministicCandidate | null = null;
      for (const app of companyMatches) {
        let confidence = 0.72;
        if (role && rolesMatch(app.role, role)) confidence += 0.16;
        if (senderDomain && domainMatchesCompany(senderDomain, app.company)) {
          confidence += 0.08;
        }
        confidence = Math.min(0.96, confidence);
        if (!best || confidence > best.confidence) {
          best = { application: app, confidence, method: "company" };
        }
      }
      if (best) candidates.push(best);
    }
  }

  if (company || role) {
    for (const app of applications) {
      if (candidates.some((c) => c.application.id === app.id)) continue;
      if (senderDomain && domainMatchesCompany(senderDomain, app.company)) {
        let confidence = 0.72;
        if (company && companyNamesMatch(app.company, company)) {
          confidence += 0.1;
        }
        if (role && rolesMatch(app.role, role)) confidence += 0.06;
        candidates.push({
          application: app,
          confidence: Math.min(0.9, confidence),
          method: "domain",
        });
      }
    }
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}

function decisionForConfidence(confidence: number): MatchDecision {
  if (confidence >= AUTO_THRESHOLD) return "auto";
  if (confidence >= CONFIRM_THRESHOLD) return "confirm";
  return "none";
}

export interface MatchOutcome {
  decision: MatchDecision;
  applicationId: string | null;
  confidence: number;
  method: MatchMethod;
  reason: string;
}

export async function matchEvent(
  supabase: SupabaseClient,
  event: EventRow,
  applications: ApplicationRow[],
): Promise<MatchOutcome> {
  const extraction = event.extracted_data?.extraction;

  if (event.gmail_thread_id) {
    const { data: threadMatch } = await supabase
      .from("OS_Email_Events")
      .select("application_id")
      .eq("gmail_thread_id", event.gmail_thread_id)
      .not("application_id", "is", null)
      .neq("id", event.id)
      .limit(1)
      .maybeSingle();

    const linkedApp = applications.find(
      (app) => app.id === threadMatch?.application_id,
    );
    if (threadMatch?.application_id && linkedApp) {
      return {
        decision: "auto",
        applicationId: linkedApp.id,
        confidence: 0.95,
        method: "thread",
        reason: "Previous email in this thread matched this application",
      };
    }
  }

  if (!extraction) {
    return {
      decision: "none",
      applicationId: null,
      confidence: 0,
      method: "ai",
      reason: "No extraction data available to match against",
    };
  }

  const senderDomain = event.sender ? senderDomainFromEmail(event.sender) : "";

  const deterministic = findDeterministicCandidates(
    extraction,
    senderDomain,
    applications,
  );

  if (deterministic.length > 0) {
    const best = deterministic[0];
    const decision = decisionForConfidence(best.confidence);
    return {
      decision,
      applicationId: decision === "none" ? null : best.application.id,
      confidence: best.confidence,
      method: best.method,
      reason: `Deterministic ${best.method} match (${best.confidence.toFixed(2)})`,
    };
  }

  if (applications.length === 0) {
    return {
      decision: "none",
      applicationId: null,
      confidence: 0,
      method: "ai",
      reason: "No applications exist to match against",
    };
  }

  try {
    const aiMatch = await matchApplicationAi(
      extraction,
      senderDomain,
      applications.map((app): ApplicationSummary => ({
        id: app.id,
        company: app.company,
        role: app.role,
        status: app.status,
      })),
    );

    if (!aiMatch.applicationId) {
      return {
        decision: "none",
        applicationId: null,
        confidence: aiMatch.confidence,
        method: "ai",
        reason: aiMatch.reason || "AI could not find a matching application",
      };
    }

    const matchedApp = applications.find(
      (app) => app.id === aiMatch.applicationId,
    );
    if (!matchedApp) {
      return {
        decision: "none",
        applicationId: null,
        confidence: aiMatch.confidence,
        method: "ai",
        reason: "AI returned an invalid application",
      };
    }

    const deterministicProxy =
      (extraction.company &&
        companyNamesMatch(matchedApp.company, extraction.company)) ||
      (senderDomain && domainMatchesCompany(senderDomain, matchedApp.company));

    let confidence = aiMatch.confidence;
    let decision = decisionForConfidence(confidence);

    if (decision === "auto" && !deterministicProxy) {
      confidence = Math.min(confidence, 0.85);
      decision = "confirm";
    }

    return {
      decision,
      applicationId: decision === "none" ? null : matchedApp.id,
      confidence,
      method: "ai",
      reason: aiMatch.reason || "AI match",
    };
  } catch {
    return {
      decision: "none",
      applicationId: null,
      confidence: 0,
      method: "ai",
      reason: "AI matching failed",
    };
  }
}

function toMatchingMeta(outcome: MatchOutcome): MatchingMeta {
  if (outcome.decision === "auto") {
    return {
      status: "matched",
      applicationId: outcome.applicationId,
      confidence: outcome.confidence,
      reason: outcome.reason,
      method: outcome.method,
    };
  }
  if (outcome.decision === "confirm") {
    return {
      status: "pending",
      applicationId: outcome.applicationId,
      confidence: outcome.confidence,
      reason: outcome.reason,
      method: outcome.method,
    };
  }
  return {
    status: "none",
    confidence: outcome.confidence,
    reason: outcome.reason,
    method: outcome.method,
  };
}

export async function runMatching(
  supabase: SupabaseClient,
  userId: string,
): Promise<MatchSummary> {
  const summary: MatchSummary = {
    processed: 0,
    matched: 0,
    pending: 0,
    none: 0,
    errors: 0,
  };

  const { data: applicationData } = await supabase
    .from("OS_Applications")
    .select("id, user_id, company, role, status, applied_at")
    .eq("user_id", userId);

  const applications = (applicationData ?? []) as ApplicationRow[];

  const { data: eventData } = await supabase
    .from("OS_Email_Events")
    .select("id, user_id, application_id, gmail_thread_id, sender, extracted_data")
    .eq("user_id", userId)
    .is("application_id", null);

  const events = (eventData ?? []) as EventRow[];

  for (const event of events) {
    if (event.extracted_data?.isJobRelated === false) continue;
    const matching = event.extracted_data?.matching;
    if (matching && ["matched", "pending", "dismissed"].includes(matching.status)) {
      continue;
    }

    summary.processed += 1;

    try {
      const outcome = await matchEvent(supabase, event, applications);

      const nextExtracted = {
        ...(event.extracted_data ?? {}),
        matching: toMatchingMeta(outcome),
      };

      const updates: Record<string, unknown> = {
        extracted_data: nextExtracted,
      };

      if (outcome.decision === "auto" && outcome.applicationId) {
        updates.application_id = outcome.applicationId;
        const app = applications.find((a) => a.id === outcome.applicationId);
        if (app) {
          await applySuggestedStatus(supabase, app, event);
        }
        summary.matched += 1;
      } else if (outcome.decision === "confirm") {
        summary.pending += 1;
      } else {
        summary.none += 1;
      }

      const { error } = await supabase
        .from("OS_Email_Events")
        .update(updates)
        .eq("id", event.id)
        .eq("user_id", userId);

      if (error) {
        summary.errors += 1;
      }
    } catch {
      summary.errors += 1;
    }
  }

  return summary;
}

export async function confirmEventMatch(
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
  applicationId: string,
): Promise<boolean> {
  const { data: eventData } = await supabase
    .from("OS_Email_Events")
    .select("id, user_id, application_id, gmail_thread_id, sender, extracted_data")
    .eq("id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  const event = eventData as EventRow | null;
  if (!event) return false;

  const { data: appData } = await supabase
    .from("OS_Applications")
    .select("id, user_id, company, role, status, applied_at")
    .eq("id", applicationId)
    .eq("user_id", userId)
    .maybeSingle();

  const app = appData as ApplicationRow | null;
  if (!app) return false;

  const pending = event.extracted_data?.matching;

  await supabase
    .from("OS_Email_Events")
    .update({
      application_id: app.id,
      extracted_data: {
        ...(event.extracted_data ?? {}),
        matching: {
          status: "matched",
          applicationId: app.id,
          confidence: pending?.confidence ?? 0.9,
          reason: pending?.reason ?? "Confirmed by user",
          method: pending?.method ?? "ai",
        },
      },
    })
    .eq("id", event.id)
    .eq("user_id", userId);

  await applySuggestedStatus(supabase, app, event);
  return true;
}

export async function dismissEventMatch(
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
): Promise<boolean> {
  const { data: eventData } = await supabase
    .from("OS_Email_Events")
    .select("extracted_data")
    .eq("id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!eventData) return false;

  await supabase
    .from("OS_Email_Events")
    .update({
      extracted_data: {
        ...(eventData.extracted_data ?? {}),
        matching: {
          ...(eventData.extracted_data?.matching ?? {}),
          status: "dismissed",
        },
      },
    })
    .eq("id", eventId)
    .eq("user_id", userId);

  return true;
}