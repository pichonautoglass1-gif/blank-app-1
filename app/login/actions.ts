"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !email.includes("@")) redirect("/login?error=Enter+a+valid+email");
  if (password.length < 8) redirect("/login?error=Password+must+be+at+least+8+characters");
  return { email, password };
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const credentials = readCredentials(formData);
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const credentials = readCredentials(formData);
  const fullName = String(formData.get("fullName") ?? "").trim();
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  if (data.session) redirect("/onboarding");
  redirect("/login?message=Check+your+email+to+confirm+your+SalesRadar+account");
}
