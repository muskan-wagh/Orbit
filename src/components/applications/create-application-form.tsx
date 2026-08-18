"use client";

import { useActionState } from "react";
import { createApplication } from "@/lib/actions/applications";
import type { ApplicationStatus } from "@/lib/constants";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateApplicationForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(createApplication, null);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" placeholder="Acme Corp" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <Input id="role" name="role" placeholder="Senior Engineer" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="platform">Platform</Label>
          <Input id="platform" name="platform" placeholder="LinkedIn" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="Remote" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="job_url">Job URL</Label>
          <Input id="job_url" name="job_url" type="url" placeholder="https://..." />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="salary">Salary</Label>
          <Input id="salary" name="salary" placeholder="$120k–$150k" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="applied_at">Applied on</Label>
          <Input id="applied_at" name="applied_at" type="date" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue="APPLIED">
            <SelectTrigger id="status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {APPLICATION_STATUSES.map((status: ApplicationStatus) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Recruiter call, referral name, etc." />
      </div>

      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add application"}
      </Button>
      <Button type="button" variant="outline" onClick={onDone}>
        Cancel
      </Button>
    </form>
  );
}
