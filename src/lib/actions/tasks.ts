"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateTasks } from "@/lib/tasks/generate";

export async function generateTasksNow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const summary = await generateTasks(supabase, user.id);
  redirect(`/?tasks=${summary.created}`);
}

export async function updateTaskStatus(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (id && status) {
    await supabase
      .from("OS_Tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
  }

  redirect("/");
}

export async function deleteTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "");

  if (id) {
    await supabase
      .from("OS_Tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
  }

  redirect("/");
}