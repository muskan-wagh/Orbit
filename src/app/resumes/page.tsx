import { AppShell } from "@/components/layout/app-shell";
import { FileText } from "lucide-react";

export default function ResumesPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-8 py-10">
        <h1 className="text-lg font-semibold">Resumes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Store and manage the resumes used for each application.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-dashed py-20 text-center">
          <FileText className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Resume Vault is coming in a future release.
          </p>
        </div>
      </div>
    </AppShell>
  );
}