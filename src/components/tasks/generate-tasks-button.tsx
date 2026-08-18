import { generateTasksNow } from "@/lib/actions/tasks";
import { SubmitButton } from "@/components/gmail/submit-button";
import { ListChecks } from "lucide-react";

export function GenerateTasksButton() {
  return (
    <form action={generateTasksNow}>
      <SubmitButton variant="outline" size="sm">
        <ListChecks className="size-4" />
        Generate tasks
      </SubmitButton>
    </form>
  );
}