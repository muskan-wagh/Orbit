import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/gmail/oauth";
import { getGmailProfile } from "@/lib/gmail/client";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("gmail_oauth_state")?.value;

  const redirectTo = (status: string, reason?: string) => {
    const url = new URL(`${origin}/`);
    url.searchParams.set("gmail", status);
    if (reason) url.searchParams.set("reason", reason);
    const response = NextResponse.redirect(url.toString());
    response.cookies.delete("gmail_oauth_state");
    return response;
  };

  if (oauthError || !code || !state || !storedState || storedState !== state) {
    return redirectTo("error");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectTo("error");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      return redirectTo(
        "error",
        "Google did not return a refresh token. Re-consent in the Google account prompt.",
      );
    }

    const profile = await getGmailProfile(tokens.access_token);

    const { error } = await supabase
      .from("OS_Gmail_Connections")
      .upsert(
        {
          user_id: user.id,
          google_email: profile.emailAddress,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: new Date(
            Date.now() + tokens.expires_in * 1000,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) {
      throw error;
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown Google OAuth error";
    return redirectTo("error", message.slice(0, 200));
  }

  return redirectTo("connected");
}