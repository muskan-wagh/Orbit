import "server-only";
import type { ParsedEmail } from "@/lib/email/message";

const JOB_KEYWORDS = [
  "interview",
  "assessment",
  "technical test",
  "take-home",
  "offer",
  "rejected",
  "rejection",
  "application",
  "your application",
  "candidate",
  "recruiter",
  "hiring",
  "job posting",
  "career opportunity",
  "onboarding",
  "background check",
  "references",
  "next steps",
  "update on your",
  "job alert",
  "you've been selected",
  "invitation",
  "schedule",
  "meet the team",
  "salary",
  "compensation",
  "on-site",
  "opportunity",
] as const;

const ATS_DOMAINS = [
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "workable.com",
  "bamboohr.com",
  "smartrecruiters.com",
  "recruitee.com",
  "workday.com",
  "jobvite.com",
  "icims.com",
  "bullhorn.com",
  "ceipal.com",
  "teamtailor.com",
  "pinpointhq.com",
  "recruit.net",
  "hire.trakstar.com",
  "fenwickrecruiting.com",
  "jobscore.com",
] as const;

const RECRUITER_SENDER_PREFIXES = [
  "recruiting@",
  "recruiter@",
  "careers@",
  "career@",
  "jobs@",
  "hiring@",
  "talent@",
  "talentacquisition@",
  "talent-acquisition@",
  "people@",
  "hr@",
  "no-reply@jobs.",
  "noreply@jobs.",
] as const;

const NOISE_PREFIXES = ["unsubscribe", "newsletter", "promo", "social", "deal"] as const;

function subjectBodyText(email: ParsedEmail): string {
  return `${email.subject} ${email.body}`.toLowerCase();
}

export interface CandidateFilterResult {
  isCandidate: boolean;
  reasons: string[];
}

export function isEmailCandidate(email: ParsedEmail): CandidateFilterResult {
  const reasons: string[] = [];
  const text = subjectBodyText(email);
  const subject = email.subject.toLowerCase();

  for (const keyword of JOB_KEYWORDS) {
    if (text.includes(keyword)) {
      reasons.push(`keyword:${keyword}`);
      break;
    }
  }

  if ((ATS_DOMAINS as readonly string[]).includes(email.senderDomain)) {
    reasons.push(`ats:${email.senderDomain}`);
  }

  for (const prefix of RECRUITER_SENDER_PREFIXES) {
    if (email.senderEmail.toLowerCase().startsWith(prefix)) {
      reasons.push(`sender:${email.senderEmail}`);
      break;
    }
  }

  const noise = NOISE_PREFIXES.find((p) => subject.startsWith(p));
  if (noise) {
    return { isCandidate: false, reasons: [`noise:${noise}`] };
  }

  return { isCandidate: reasons.length > 0, reasons };
}