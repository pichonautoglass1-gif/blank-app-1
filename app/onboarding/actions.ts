"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const autoGlassTerms = ["windshield", "cracked windshield", "auto glass", "car window", "rock chip", "door glass", "back glass", "mobile windshield"];

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "business";
}

export async function createWorkspace(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?error=Please+sign+in+again");

  const { data: existing } = await supabase.from("businesses").select("id").eq("owner_id", userId).limit(1).maybeSingle();
  if (existing) redirect("/dashboard");

  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "auto_glass").trim();
  const city = String(formData.get("city") ?? "Phoenix").trim();
  const state = String(formData.get("state") ?? "AZ").trim().toUpperCase();
  const website = String(formData.get("website") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const radius = Math.min(250, Math.max(1, Number(formData.get("radius") ?? 45)));

  if (name.length < 2 || city.length < 2) redirect("/onboarding?error=Business+name+and+city+are+required");

  const slug = `${slugify(name)}-${userId.slice(0, 6)}`;
  const { data: business, error: businessError } = await supabase.from("businesses").insert({
    owner_id: userId,
    name,
    slug,
    industry,
    home_city: city,
    state,
    website,
    phone,
    timezone: state === "AZ" ? "America/Phoenix" : "America/Phoenix",
  }).select("id").single();

  if (businessError || !business) redirect(`/onboarding?error=${encodeURIComponent(businessError?.message || "Could not create workspace")}`);

  const { error: territoryError } = await supabase.from("territories").insert({
    business_id: business.id,
    city,
    state,
    radius_miles: radius,
  });
  if (territoryError) redirect(`/onboarding?error=${encodeURIComponent(territoryError.message)}`);

  const terms = industry === "auto_glass" ? autoGlassTerms : ["recommendation", "looking for", "need someone", "quote", "near me"];
  const service = industry === "auto_glass" ? "Auto glass" : "Core services";
  const { error: ruleError } = await supabase.from("watch_rules").insert({
    business_id: business.id,
    name: "Primary buyer-intent radar",
    service,
    include_terms: terms,
    exclude_terms: ["job opening", "hiring", "DIY"],
    min_intent_score: 70,
  });
  if (ruleError) redirect(`/onboarding?error=${encodeURIComponent(ruleError.message)}`);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
