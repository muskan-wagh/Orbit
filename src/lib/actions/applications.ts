"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/constants";

type ActionState = { error: string } | null;

function getString(
  formData: FormData,
  key: string,
  defaultValue: string | null = null,
): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? defaultValue : value;
}

function parseStatus(value: string | null): ApplicationStatus {
  const status = (value ?? "APPLIED") as ApplicationStatus;
  return APPLICATION_STATUSES.includes(status) ? status : "APPLIED";
}

export async function createApplication(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const company = getString(formData, "company");
  const role = getString(formData, "role");

  if (!company || !role) {
    return { error: "Company and role are required." };
  }

  const { error } = await supabase.from("OS_Applications").insert({
    user_id: user.id,
    company,
    role,
    platform: getString(formData, "platform"),
    job_url: getString(formData, "job_url"),
    location: getString(formData, "location"),
    salary: getString(formData, "salary"),
    status: parseStatus(getString(formData, "status", "APPLIED")),
    applied_at: getString(formData, "applied_at") ?? null,
    notes: getString(formData, "notes"),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  redirect("/");
}

export async function updateApplication(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = getString(formData, "id");
  if (!id) {
    return { error: "Missing application id." };
  }

  const company = getString(formData, "company");
  const role = getString(formData, "role");

  if (!company || !role) {
    return { error: "Company and role are required." };
  }

  const { error } = await supabase
    .from("OS_Applications")
    .update({
      company,
      role,
      platform: getString(formData, "platform"),
      job_url: getString(formData, "job_url"),
      location: getString(formData, "location"),
      salary: getString(formData, "salary"),
      status: parseStatus(getString(formData, "status", "APPLIED")),
      applied_at: getString(formData, "applied_at") ?? null,
      notes: getString(formData, "notes"),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath(`/applications/${id}`);
  redirect(`/applications/${id}`);
}

export async function deleteApplication(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = getString(formData, "id");
  if (!id) {
    return;
  }

  await supabase.from("OS_Applications").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/");
  redirect("/");
}

export async function updateApplicationStatus(
  formData: FormData,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = getString(formData, "id");
  const status = parseStatus(getString(formData, "status", "APPLIED"));

  if (!id) {
    return;
  }

  await supabase
    .from("OS_Applications")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/");
  revalidatePath(`/applications/${id}`);
}
