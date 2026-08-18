import type { ApplicationStatus } from "@/lib/constants";

export const STATUS_DOT: Record<ApplicationStatus, string> = {
  APPLIED: "bg-zinc-400",
  ASSESSMENT: "bg-amber-500",
  INTERVIEW: "bg-blue-500",
  OFFER: "bg-emerald-500",
  REJECTED: "bg-red-500",
  WITHDRAWN: "bg-zinc-300",
};