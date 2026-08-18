"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateApplicationStatus } from "@/lib/actions/applications";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/constants";
import { STATUS_DOT } from "@/lib/status-ui";

export function InlineStatus({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="group inline-flex items-center gap-1.5">
      <span className={`size-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
      <select
        defaultValue={status}
        disabled={pending}
        onChange={(event) => {
          const value = event.target.value as ApplicationStatus;
          const formData = new FormData();
          formData.set("id", applicationId);
          formData.set("status", value);
          startTransition(() => {
            void updateApplicationStatus(formData).then(() => router.refresh());
          });
        }}
        className="w-[7.5rem] cursor-pointer rounded border border-transparent bg-transparent py-1 pl-0 pr-1 text-sm outline-none transition-colors hover:border-border hover:bg-accent/50 focus-visible:border-ring disabled:opacity-50"
      >
        {APPLICATION_STATUSES.map((option: ApplicationStatus) => (
          <option key={option} value={option} className="bg-popover">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}