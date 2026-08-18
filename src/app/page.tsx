import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/lib/types";
import { APPLICATION_STATUSES, STATUS_VARIANTS } from "@/lib/constants";
import { deleteApplication } from "@/lib/actions/applications";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CreateApplicationDialog } from "@/components/applications/create-application-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: Application["status"] }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{status}</Badge>;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: applications } = await supabase
    .from("OS_Applications")
    .select("*")
    .order("applied_at", { ascending: false })
    .order("created_at", { ascending: false });

  const counts = APPLICATION_STATUSES.reduce<Record<string, number>>(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {},
  );
  for (const app of applications ?? []) {
    counts[app.status] = (counts[app.status] ?? 0) + 1;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Orbit</h1>
            <span className="text-muted-foreground">
              Job Application OS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Applications</h2>
            <p className="text-sm text-muted-foreground">
              Track and manage your job applications.
            </p>
          </div>
          <CreateApplicationDialog />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {APPLICATION_STATUSES.map((status) => (
            <Card key={status}>
              <CardHeader className="pb-2">
                <CardDescription>{status}</CardDescription>
                <CardTitle className="text-2xl">{counts[status]}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            {applications && applications.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        <Link href={`/applications/${app.id}`}>
                          {app.company}
                        </Link>
                      </TableCell>
                      <TableCell>{app.role}</TableCell>
                      <TableCell>{app.platform ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={app.status} />
                      </TableCell>
                      <TableCell>{formatDate(app.applied_at)}</TableCell>
                      <TableCell className="text-right">
                        <form action={deleteApplication} className="inline">
                          <input type="hidden" name="id" value={app.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${app.company}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <p className="text-muted-foreground">
                  No applications yet.
                </p>
                <CreateApplicationDialog />
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
