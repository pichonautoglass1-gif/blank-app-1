import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createWorkspace } from "./actions";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function OnboardingPage({ searchParams }: { searchParams: Params }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: existing } = await supabase.from("businesses").select("id").eq("owner_id", userId).limit(1).maybeSingle();
  if (existing) redirect("/dashboard");

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="setupShell">
      <section className="setupCard">
        <div className="setupHeader">
          <div className="authLogo"><span className="authLogoMark">◎</span>SalesRadar <b>AI</b></div>
          <span className="setupStep">Workspace setup · 1 of 1</span>
        </div>
        <div className="setupIntro">
          <span className="authEyebrow">BUILD YOUR BUYER-INTENT RADAR</span>
          <h1>Tell SalesRadar what business to hunt for.</h1>
          <p>This creates your private workspace, starting territory and first AI monitoring rule.</p>
        </div>
        {error && <div className="authAlert error">{error}</div>}
        <form className="setupForm" action={createWorkspace}>
          <div className="fieldGrid two">
            <label>Business name<input name="name" placeholder="Pichon Auto Glass" required /></label>
            <label>Industry<select name="industry" defaultValue="auto_glass"><option value="auto_glass">Auto Glass</option><option value="roofing">Roofing</option><option value="hvac">HVAC</option><option value="plumbing">Plumbing</option><option value="restoration">Restoration</option><option value="landscaping">Landscaping</option><option value="other">Other local service</option></select></label>
          </div>
          <div className="fieldGrid three">
            <label>Home city<input name="city" defaultValue="Phoenix" required /></label>
            <label>State<input name="state" defaultValue="AZ" maxLength={2} required /></label>
            <label>Service radius<select name="radius" defaultValue="45"><option value="20">20 miles</option><option value="35">35 miles</option><option value="45">45 miles</option><option value="60">60 miles</option><option value="100">100 miles</option></select></label>
          </div>
          <div className="fieldGrid two">
            <label>Website <span>optional</span><input name="website" type="url" placeholder="https://yourbusiness.com" /></label>
            <label>Business phone <span>optional</span><input name="phone" type="tel" placeholder="(602) 555-0123" /></label>
          </div>
          <div className="setupPreview">
            <span className="liveDot" /><div><strong>Your first radar starts immediately.</strong><p>We’ll create a 70+ intent rule and configure your service territory. Sources can be added next.</p></div>
          </div>
          <button className="authPrimary setupSubmit" type="submit">Create SalesRadar workspace →</button>
        </form>
      </section>
    </main>
  );
}
