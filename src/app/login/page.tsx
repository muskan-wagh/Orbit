import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignInButton } from "@/components/auth/sign-in-button";
import { LegalFooter } from "@/components/layout/legal-footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Orbit</CardTitle>
            <CardDescription>
              AI Job Application OS — sign in to manage your applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="mb-4 text-sm text-destructive">
                Sign in failed. Please try again.
              </p>
            ) : null}
            <SignInButton />
          </CardContent>
        </Card>
      </div>
      <LegalFooter />
    </main>
  );
}
