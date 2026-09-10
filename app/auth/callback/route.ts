import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      url.pathname = next;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  url.pathname = "/login";
  url.search = "?error=Unable+to+confirm+your+account";
  return NextResponse.redirect(url);
}
