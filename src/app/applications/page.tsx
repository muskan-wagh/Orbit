import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { TableToolbar } from "@/components/applications/table-toolbar";
import { ApplicationsTable } from "@/components/applications/applications-table";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    platform?: string;
    sort?: string;
    since?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: apps } = await supabase
    .from("OS_Applications")
    .select("platform")
    .eq("user_id", user?.id);

  const platforms = [
    ...new Set(
      (apps ?? []).map((app) => app.platform).filter((p): p is string => Boolean(p)),
    ),
  ].sort();

  const params = await searchParams;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-lg font-semibold">Applications</h1>
            <p className="text-sm text-muted-foreground">
              Your full application pipeline.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <TableToolbar key={params.q ?? ""} platforms={platforms} />
          <ApplicationsTable userId={user?.id ?? ""} searchParams={params} />
        </div>
      </div>
    </AppShell>
  );
}