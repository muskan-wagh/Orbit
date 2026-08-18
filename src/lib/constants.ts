export const APPLICATION_STATUSES = [
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as const;

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type StatusVariant = "default" | "secondary" | "destructive" | "outline";

export const STATUS_VARIANTS: Record<ApplicationStatus, StatusVariant> = {
  APPLIED: "secondary",
  ASSESSMENT: "outline",
  INTERVIEW: "default",
  OFFER: "default",
  REJECTED: "destructive",
  WITHDRAWN: "outline",
};
