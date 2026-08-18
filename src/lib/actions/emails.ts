"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncGmailEmails, type SyncResult } from "@/lib/email/sync";

export async function syncEmails(): Promise<SyncResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return syncGmailEmails(supabase, user.id);
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