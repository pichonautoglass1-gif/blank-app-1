import Link from "next/link";
import { redirect } from "next/navigation";
import { connectorRegistry } from "@/lib/connectors/registry";
import { createClient } from "@/lib/supabase/server";
import "./sources.css";

export const dynamic = "force-dynamic";

function statusCopy(health: string) {
  if (health === "available") return "Ready to connect";
  if (health === "approval_required") return "Approval required";
  if (health === "limited") return "Limited access";
  return "Coming soon";
}

export default async function SourcesPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id,name")
    .eq("owner_id", userId)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (!business) redirect("/onboarding");

  const { data: connections } = await supabase
    .from("source_connections")
    .select("provider,status,external_account_label,last_synced_at,last_error")
    .eq("business_id", business.id);

  const byProvider = new Map((connections ?? []).map((item) => [item.provider, item]));

  return (
    <main className="sourcesPage">
      <header className="sourcesHeader">
        <div>
          <Link href="/dashboard" className="backLink">← Back to radar</Link>
          <div className="eyebrow">SIGNAL INFRASTRUCTURE</div>
          <h1>Connect the internet to your radar.</h1>
          <p>Every source is normalized into the same buyer-intent pipeline, scored by the same AI engine, then matched to your territory.</p>
        </div>
        <div className="sourceWorkspace"><span>Workspace</span><strong>{business.name}</strong></div>
      </header>

      <section className="sourceSummary">
        <article><strong>{connectorRegistry.length}</strong><span>supported source types</span></article>
        <article><strong>{connectorRegistry.filter((x) => x.health === "available").length}</strong><span>connectable first-party APIs</span></article>
        <article><strong>{(connections ?? []).filter((x) => x.status === "connected").length}</strong><span>connected to this workspace</span></article>
      </section>

      <section className="sourcesGrid">
        {connectorRegistry.map((connector) => {
          const connection = byProvider.get(connector.provider);
          const connected = connection?.status === "connected";
          return (
            <article className="sourceCard" key={connector.provider}>
              <div className="sourceCardTop">
                <div className={`networkBadge network-${connector.provider}`}>{connector.shortLabel}</div>
                <div className="sourceIdentity"><h2>{connector.label}</h2><span>Priority {connector.priority}</span></div>
                <span className={`sourceState ${connected ? "connected" : connector.health}`}>{connected ? "Connected" : statusCopy(connector.health)}</span>
              </div>
              <p>{connector.description}</p>
              <div className="capabilityList">
                {connector.capabilities.map((capability) => <span key={capability}>{capability.replaceAll("_", " ")}</span>)}
              </div>
              <div className="sourceNote">{connector.note}</div>
              <div className="sourceFooter">
                <div>{connection?.external_account_label ? <><span>Account</span><strong>{connection.external_account_label}</strong></> : <><span>Configuration</span><strong>{connected ? "Active" : "Credentials not added"}</strong></>}</div>
                <button type="button" disabled>{connected ? "Manage" : connector.health === "available" ? "Connect next" : "Access pending"}</button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="pipelineExplainer">
        <div><span>01</span><strong>Listen</strong><p>Approved APIs and webhooks collect permitted public or connected-account activity.</p></div>
        <i>→</i>
        <div><span>02</span><strong>Normalize</strong><p>Every network becomes one secure SalesRadar signal format.</p></div>
        <i>→</i>
        <div><span>03</span><strong>Score</strong><p>The Intent Engine filters noise, ranks buying intent and extracts service context.</p></div>
        <i>→</i>
        <div><span>04</span><strong>Route</strong><p>Qualified opportunities are matched to the right business and territory.</p></div>
      </section>
    </main>
  );
}
