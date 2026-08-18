"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncEmails } from "@/lib/actions/emails";
import type { SyncResult } from "@/lib/email/sync";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

export function SyncEmailsButton() {
  const router = useRouter();
  const [result, formAction, pending] = useActionState<SyncResult | null, FormData>(
    syncEmails,
    null,
  );

  useEffect(() => {
    if (result && !pending) {
      router.refresh();
    }
  }, [result, pending, router]);

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        {pending ? "Syncing…" : "Sync emails"}
      </Button>
      {result?.message ? (
        <p className="text-sm text-muted-foreground">{result.message}</p>
      ) : null}
      {result && result.errors > 0 ? (
        <p className="text-sm text-destructive">
          {result.errors} error{result.errors === 1 ? "" : "s"} during sync.
        </p>
      ) : null}
    </form>
  );
}