import type { ApplicationStatus } from "@/lib/constants";

export interface Application {
  id: string;
  user_id: string;
  company: string;
  role: string;
  platform: string | null;
  job_url: string | null;
  location: string | null;
  salary: string | null;
  status: ApplicationStatus;
  applied_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
