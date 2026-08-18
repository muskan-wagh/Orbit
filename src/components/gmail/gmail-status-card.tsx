import { initiateGmailConnect, disconnectGmail } from "@/lib/actions/gmail";
import { SubmitButton } from "@/components/gmail/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail } from "lucide-react";

export function GmailStatusCard({
  googleEmail,
}: {
  googleEmail: string | null;
}) {
  if (googleEmail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4" />
            Gmail
          </CardTitle>
          <CardDescription>Connected as {googleEmail}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={disconnectGmail}>
            <SubmitButton variant="outline" size="sm">
              Disconnect
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="size-4" />
          Gmail
        </CardTitle>
        <CardDescription>
          Connect your Gmail to automatically track applications from email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={initiateGmailConnect}>
          <SubmitButton>Connect Gmail</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}