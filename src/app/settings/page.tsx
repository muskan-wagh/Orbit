import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-8 py-10">
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account preferences.
        </p>

        <div className="mt-8 max-w-md space-y-4">
          <div className="rounded-lg border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-sm font-medium">Account</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}