import { redirect } from "next/navigation";
import { SalesRadarDashboard } from "@/components/sales-radar-dashboard";
import { createClient } from "@/lib/supabase/server";
import { dbStatusToUi, formatAge, type DashboardBusiness, type Lead } from "@/lib/salesradar-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (claimsError || !claims?.sub) redirect("/login");

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id,name,industry,home_city,state")
    .eq("owner_id", claims.sub)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (businessError) throw new Error(`Could not load workspace: ${businessError.message}`);
  if (!business) redirect("/onboarding");

  const [{ data: territory }, { data: rows, error: leadsError }] = await Promise.all([
    supabase.from("territories").select("city,state,radius_miles").eq("business_id", business.id).eq("active", true).limit(1).maybeSingle(),
    supabase.from("leads").select("id,service,lead_score,purchase_intent,urgency,location,city,state,mobile_service,vehicle,ai_reason,suggested_reply,status,estimated_value,created_at").eq("business_id", business.id).order("created_at", { ascending: false }).limit(100),
  ]);

  if (leadsError) throw new Error(`Could not load leads: ${leadsError.message}`);

  const leads: Lead[] = (rows ?? []).map((row) => {
    const value = Number(row.estimated_value ?? 0);
    const urgency = Number(row.urgency ?? 0);
    const city = row.city || row.location || business.home_city || "Phoenix";
    return {
      id: row.id,
      score: row.lead_score,
      service: row.service || "Service opportunity",
      city,
      source: "SalesRadar signal",
      age: formatAge(row.created_at),
      text: row.ai_reason || "Buyer-intent signal captured by SalesRadar.",
      urgency: urgency >= 0.85 ? "Urgent" : urgency >= 0.6 ? "High" : urgency >= 0.35 ? "Medium" : "Normal",
      valueMin: value ? Math.round(value * 0.85) : 0,
      valueMax: value ? Math.round(value * 1.15) : 0,
      status: dbStatusToUi(row.status),
      vehicle: row.vehicle || undefined,
      tags: [
        row.mobile_service ? "Mobile requested" : "Service intent",
        row.purchase_intent && Number(row.purchase_intent) >= 0.85 ? "High purchase intent" : "Qualified",
        row.vehicle ? "Vehicle identified" : "Needs qualification",
      ],
      reason: row.ai_reason || "This signal matched the business's service and territory rules.",
      reply: row.suggested_reply || "Thanks for reaching out. We can help with that. What year, make and model is the vehicle, and what ZIP code are you in?",
    };
  });

  const businessView: DashboardBusiness = {
    id: business.id,
    name: business.name,
    industry: business.industry,
    homeCity: business.home_city || territory?.city || "Phoenix",
    state: business.state || territory?.state || "AZ",
    territoryLabel: territory ? `${territory.city} + ${territory.radius_miles} mi` : `${business.home_city || "Phoenix"} market`,
  };

  const email = typeof claims.email === "string" ? claims.email : "owner@business.com";
  return <SalesRadarDashboard initialLeads={leads} business={businessView} userEmail={email} />;
}
