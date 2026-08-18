import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteApplication } from "@/lib/actions/applications";
import { STATUS_VARIANTS, type ApplicationStatus } from "@/lib/constants";
import { EditApplicationForm } from "@/components/applications/edit-application-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Trash2 } from "lucide-react";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: application } = await supabase
    .from("OS_Applications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user?.id)
    .single();

  if (!application) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to applications
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{application.company}</h1>
              <Badge variant={STATUS_VARIANTS[application.status as ApplicationStatus]}>
                {application.status}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">{application.role}</p>
          </div>
          <form action={deleteApplication}>
            <input type="hidden" name="id" value={application.id} />
            <Button type="submit" variant="outline" size="sm">
              <Trash2 className="size-4" />
              Delete
            </Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Platform" value={application.platform} />
            <DetailRow label="Location" value={application.location} />
            <DetailRow label="Salary" value={application.salary} />
            <DetailRow
              label="Applied on"
              value={formatDate(application.applied_at)}
            />
            <DetailRow label="Created" value={formatDate(application.created_at)} />
            <DetailRow label="Updated" value={formatDate(application.updated_at)} />
            {application.job_url ? (
              <div className="py-2 text-sm">
                <span className="text-muted-foreground">Job URL: </span>
                <a
                  href={application.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4"
                >
                  {application.job_url}
                </a>
              </div>
            ) : null}
            {application.notes ? (
              <div className="py-2 text-sm">
                <span className="text-muted-foreground">Notes: </span>
                <span className="whitespace-pre-wrap">{application.notes}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit application</CardTitle>
          </CardHeader>
          <CardContent>
            <EditApplicationForm application={application} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}