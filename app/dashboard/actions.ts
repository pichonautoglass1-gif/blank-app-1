"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type LeadStatus, uiStatusToDb } from "@/lib/salesradar-data";

const allowed: LeadStatus[] = ["New", "Contacted", "Quoted", "Booked", "Won", "Lost"];

export async function updateLeadStatus(leadId: string, nextStatus: LeadStatus) {
  if (!allowed.includes(nextStatus)) return { ok: false, error: "Invalid lead status" };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return { ok: false, error: "Not authenticated" };

  const now = new Date().toISOString();
  const patch: Record<string, string | null> = { status: uiStatusToDb(nextStatus) };
  if (nextStatus === "Contacted") patch.contacted_at = now;
  if (nextStatus === "Won") patch.won_at = now;

  const { error } = await supabase.from("leads").update(patch).eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}
