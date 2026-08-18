"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncGmailEmails, type SyncResult } from "@/lib/email/sync";
import { runMatching } from "@/lib/match/engine";
import { generateTasks } from "@/lib/tasks/generate";

export async function syncEmails(): Promise<SyncResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const result = await syncGmailEmails(supabase, user.id);

  if (result.inserted > 0) {
    const matching = await runMatching(supabase, user.id);
    const tasks = await generateTasks(supabase, user.id);
    result.message = `${result.message} Matching: ${matching.matched} auto-matched, ${matching.pending} need confirmation, ${matching.none} unmatched. Tasks created: ${tasks.created}.`;
  }

  return result;
}

export async function deleteEmailEvent(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("OS_Email_Events").delete().eq("id", id).eq("user_id", user.id);

  redirect("/");
}