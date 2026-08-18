"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  runMatching,
  confirmEventMatch,
  dismissEventMatch,
} from "@/lib/match/engine";
import { generateTasks } from "@/lib/tasks/generate";

export async function matchNow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const summary = await runMatching(supabase, user.id);
  const tasks = await generateTasks(supabase, user.id);
  redirect(`/?match=${summary.matched}|${summary.pending}|${summary.errors}&tasks=${tasks.created}`);
}

export async function confirmMatch(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const eventId = String(formData.get("eventId") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");

  if (eventId && applicationId) {
    await confirmEventMatch(supabase, user.id, eventId, applicationId);
    await generateTasks(supabase, user.id);
  }

  redirect("/");
}

export async function dismissMatch(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const eventId = String(formData.get("eventId") ?? "");

  if (eventId) {
    await dismissEventMatch(supabase, user.id, eventId);
  }

  redirect("/");
}