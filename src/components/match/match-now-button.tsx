import { matchNow } from "@/lib/actions/match";
import { SubmitButton } from "@/components/gmail/submit-button";
import { Link2 } from "lucide-react";

export function MatchNowButton() {
  return (
    <form action={matchNow}>
      <SubmitButton variant="outline" size="sm">
        <Link2 className="size-4" />
        Match applications
      </SubmitButton>
    </form>
  );
}