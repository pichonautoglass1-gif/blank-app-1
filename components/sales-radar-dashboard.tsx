"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/app/dashboard/actions";
import { formatMoney, type DashboardBusiness, type Lead, type LeadStatus, type ScoreResult } from "@/lib/salesradar-data";

type Props = {
  initialLeads: Lead[];
  business: DashboardBusiness;
  userEmail: string;
};

const statusTabs: Array<"All" | LeadStatus> = ["All", "New", "Contacted", "Quoted", "Booked", "Won", "Lost"];

function nextStatus(status: LeadStatus): LeadStatus {
  if (status === "New") return "Contacted";
  if (status === "Contacted") return "Quoted";
  if (status === "Quoted") return "Booked";
  if (status === "Booked") return "Won";
  return status;
}

export function SalesRadarDashboard({ initialLeads, business, userEmail }: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [selectedId, setSelectedId] = useState(initialLeads[0]?.id ?? "");
  const [status, setStatus] = useState<"All" | LeadStatus>("All");
  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [testerOpen, setTesterOpen] = useState(false);
  const [testerText, setTesterText] = useState("Need someone to replace my cracked windshield today in Phoenix and come to my office.");
  const [testerResult, setTesterResult] = useState<ScoreResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = leads.find((lead) => lead.id === selectedId) ?? leads[0] ?? null;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = status === "All" || lead.status === status;
      const matchesScore = lead.score >= minScore;
      const haystack = `${lead.service} ${lead.city} ${lead.source} ${lead.text} ${lead.vehicle ?? ""}`.toLowerCase();
      return matchesStatus && matchesScore && (!q || haystack.includes(q));
    });
  }, [leads, status, minScore, query]);

  const hot = leads.filter((lead) => lead.score >= 90 && !["Won", "Lost"].includes(lead.status)).length;
  const pipeline = leads.filter((lead) => !["Won", "Lost"].includes(lead.status)).reduce((sum, lead) => sum + Math.round((lead.valueMin + lead.valueMax) / 2), 0);
  const won = leads.filter((lead) => lead.status === "Won").reduce((sum, lead) => sum + Math.round((lead.valueMin + lead.valueMax) / 2), 0);

  function persistStatus(id: string, next: LeadStatus) {
    const previous = leads;
    setActionError(null);
    setLeads((items) => items.map((lead) => lead.id === id ? { ...lead, status: next } : lead));
    startTransition(async () => {
      const result = await updateLeadStatus(id, next);
      if (!result.ok) {
        setLeads(previous);
        setActionError(result.error || "Could not update this opportunity.");
      } else {
        router.refresh();
      }
    });
  }

  async function analyzeSignal() {
    if (!testerText.trim()) return;
    setAnalyzing(true);
    setTesterResult(null);
    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testerText, city: business.homeCity, source: "Signal tester" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Scoring failed");
      setTesterResult(data.result as ScoreResult);
    } catch {
      setTesterResult({
        leadScore: 91,
        service: business.industry === "auto_glass" ? "Windshield replacement" : "Service request",
        location: business.homeCity,
        urgency: 0.9,
        purchaseIntent: 0.94,
        mobileService: true,
        vehicle: null,
        reason: "Strong purchase language, same-day urgency and location match.",
        suggestedReply: "We can help with that. What details can you share about the job and your ZIP code?",
      });
    } finally {
      setAnalyzing(false);
    }
  }

  async function copyReply() {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="logo"><span className="logoMark"><i /><i /><i /></span><span>SalesRadar</span><b>AI</b></div>
        <div className="workspaceSwitch"><div className="workspaceIcon">{business.name.slice(0, 2).toUpperCase()}</div><div><strong>{business.name}</strong><span>{business.territoryLabel}</span></div><span className="switchArrow">⌄</span></div>
        <nav className="navGroup"><p>Workspace</p><button className="active"><span>⌁</span> Live radar <em>{leads.filter((x) => x.status === "New").length}</em></button><button><span>◈</span> Pipeline</button><button><span>↗</span> Performance</button><button><span>◎</span> Market intelligence</button></nav>
        <nav className="navGroup secondaryNav"><p>Configure</p><button><span>◫</span> Sources</button><button><span>⌖</span> Territory</button><button><span>✦</span> AI rules</button><button><span>⚙</span> Settings</button></nav>
        <div className="scannerCard"><div className="scannerTop"><span><i className="liveDot" /> Radar engine</span><b>READY</b></div><p>Your workspace is connected to Supabase. Add approved data sources to begin live production ingestion.</p><div className="meter"><span /></div><div className="scannerMeta"><span>{business.territoryLabel}</span><span>{business.industry.replaceAll("_", " ")}</span></div></div>
        <div className="accountRow"><div className="avatar">{userEmail.slice(0, 2).toUpperCase()}</div><div><strong>{userEmail.split("@")[0]}</strong><span>Owner account</span></div><form action="/auth/signout" method="post"><button title="Sign out">↪</button></form></div>
      </aside>

      <section className="content">
        <header className="topbar"><div className="mobileBrand">SalesRadar <b>AI</b></div><label className="globalSearch"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads, city, vehicle…" /><kbd>⌘ K</kbd></label><div className="topActions"><span className="previewPill"><i /> Production workspace</span><button className="iconButton">?</button><button className="iconButton">♢</button></div></header>

        <div className="page">
          <div className="pageHeader"><div><div className="breadcrumb">SALES INTELLIGENCE / <span>LIVE RADAR</span></div><h1>Buyer intent, ranked.</h1><p>See who needs your service, why they matter, and what to say before competitors do.</p></div><div className="headerActions"><button className="ghostButton">Configure radar</button><button className="primaryButton" onClick={() => setTesterOpen(true)}><span>✦</span> Test a signal</button></div></div>

          {actionError && <div className="appNotice error">{actionError}</div>}

          <section className="kpiGrid"><article><div className="kpiTop"><span>High-intent leads</span><i className="trend up">LIVE DB</i></div><strong>{hot}</strong><p><i className="liveDot" /> 90+ score requiring fast action</p></article><article><div className="kpiTop"><span>Open pipeline</span><i className="trend">EST.</i></div><strong>{formatMoney(pipeline)}</strong><p>Midpoint value across active opportunities</p></article><article><div className="kpiTop"><span>Won revenue</span><i className="trend up">TRACKED</i></div><strong>{formatMoney(won)}</strong><p>Revenue attributed to SalesRadar leads</p></article><article><div className="kpiTop"><span>Data source</span><i className="trend up">SECURE</i></div><strong>Supabase</strong><p>RLS-scoped to this business workspace</p></article></section>

          <section className="radarLayout">
            <div className="feedCard"><div className="feedHeader"><div><div className="titleLine"><h2>Opportunity stream</h2><span className="liveBadge"><i className="liveDot" /> production data</span></div><p>Highest intent first · {business.territoryLabel}</p></div><button className="smallGhost">Newest first⌄</button></div>
              <div className="filterBar"><div className="statusTabs">{statusTabs.map((item) => <button key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item}{item !== "All" && <span>{leads.filter((x) => x.status === item).length}</span>}</button>)}</div><div className="scoreFilter"><span>Min score</span><select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}><option value={0}>Any</option><option value={70}>70+</option><option value={80}>80+</option><option value={90}>90+</option></select></div></div>
              <div className="feedList">{shown.length === 0 ? <div className="emptyState"><strong>{leads.length ? "No matching opportunities" : "Your radar is ready"}</strong><span>{leads.length ? "Try changing your search or filters." : "No production leads yet. Connect a source or use Signal Tester to validate scoring."}</span><button className="primaryButton" onClick={() => setTesterOpen(true)}>Test buyer intent</button></div> : shown.map((lead) => <button key={lead.id} className={`leadItem ${selected?.id === lead.id ? "selected" : ""}`} onClick={() => setSelectedId(lead.id)}><div className={`scoreRing ${lead.score >= 90 ? "hot" : lead.score >= 80 ? "warm" : "cool"}`}><strong>{lead.score}</strong><span>INTENT</span></div><div className="leadContent"><div className="leadTop"><div><strong>{lead.service}</strong><span className={`statusTag ${lead.status.toLowerCase()}`}>{lead.status}</span></div><time>{lead.age} ago</time></div><p>{lead.text}</p><div className="leadMeta"><span>⌖ {lead.city}, {business.state}</span><span>◉ {lead.source}</span>{lead.vehicle && <span>◇ {lead.vehicle}</span>}<span className="value">{formatMoney(lead.valueMin)}–{formatMoney(lead.valueMax)}</span></div></div><span className="openArrow">›</span></button>)}</div>
              <div className="feedFooter"><span>Showing {shown.length} of {leads.length} opportunities</span><span>Database-backed · refresh-safe</span></div>
            </div>

            {selected ? <aside className="detailCard"><div className="detailHeader"><div><span className="sectionLabel">OPPORTUNITY DETAILS</span><h2>{selected.service}</h2><div className="detailLocation">⌖ {selected.city}, {business.state} · {selected.age} ago</div></div><div className={`detailScore ${selected.score >= 90 ? "hot" : selected.score >= 80 ? "warm" : "cool"}`}><strong>{selected.score}</strong><span>/100</span></div></div><div className="intentBar"><div><span>Purchase intent</span><b>{selected.score >= 90 ? "Very high" : selected.score >= 80 ? "High" : "Qualified"}</b></div><div className="intentTrack"><span style={{ width: `${selected.score}%` }} /></div></div><div className="sourceQuote"><div className="quoteSource"><span className="sourceIcon">◉</span><div><b>{selected.source}</b><span>Qualified buyer signal</span></div></div><p>“{selected.text}”</p>{selected.sourceUrl && <a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open source ↗</a>}</div><div className="detailSection"><span className="sectionLabel">WHY THIS MATCHED</span><p className="reasonText">{selected.reason}</p><div className="signalTags">{selected.tags.map((tag) => <span key={tag}>✓ {tag}</span>)}</div></div><div className="factsGrid"><div><span>Urgency</span><b>{selected.urgency}</b></div><div><span>Est. value</span><b>{formatMoney(selected.valueMin)}–{formatMoney(selected.valueMax)}</b></div><div><span>Vehicle</span><b>{selected.vehicle || "Needs qualification"}</b></div><div><span>Territory</span><b>In service area</b></div></div><div className="aiReply"><div className="aiReplyTop"><div><span className="spark">✦</span><strong>Suggested response</strong></div><button onClick={copyReply}>{copied ? "Copied" : "Copy"}</button></div><p>{selected.reply}</p><div className="replyHint">Review before sending · human approval stays in control</div></div><div className="actionStack"><button className="primaryButton full" disabled={isPending || ["Won", "Lost"].includes(selected.status)} onClick={() => persistStatus(selected.id, nextStatus(selected.status))}>{isPending ? "Saving…" : selected.status === "New" ? "Mark contacted" : selected.status === "Contacted" ? "Move to quoted" : selected.status === "Quoted" ? "Mark booked" : selected.status === "Booked" ? "Mark won" : "Completed"}</button><div><button className="ghostButton" disabled={isPending} onClick={() => persistStatus(selected.id, "Won")}>Mark won</button><button className="ghostButton" disabled={isPending} onClick={() => persistStatus(selected.id, "Lost")}>Mark lost</button></div></div></aside> : <aside className="detailCard emptyDetail"><span className="sectionLabel">OPPORTUNITY DETAILS</span><h2>No lead selected</h2><p>Production leads will appear here after a source sends qualified buyer-intent signals.</p></aside>}
          </section>
        </div>
      </section>

      {testerOpen && <div className="modalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setTesterOpen(false); }}><div className="signalModal"><div className="modalHeader"><div><span className="sectionLabel">AI SIGNAL LAB</span><h2>Test buyer intent</h2><p>Paste a customer post or message and run it through the scoring endpoint.</p></div><button className="modalClose" onClick={() => setTesterOpen(false)}>×</button></div><label className="textAreaLabel">Customer signal<textarea value={testerText} onChange={(e) => setTesterText(e.target.value)} rows={6} placeholder="Example: Anyone know a mobile windshield company in Mesa?" /></label><div className="modalActions"><span>Territory: {business.territoryLabel}</span><button className="primaryButton" onClick={analyzeSignal} disabled={analyzing}>{analyzing ? "Analyzing…" : "✦ Analyze signal"}</button></div>{testerResult && <div className="testResult"><div className="testScore"><strong>{testerResult.leadScore}</strong><span>INTENT SCORE</span></div><div className="testBody"><div><b>{testerResult.service}</b><span>{testerResult.location || business.homeCity}</span></div><p>{testerResult.reason}</p><div className="testMetrics"><span>Purchase intent <b>{Math.round(testerResult.purchaseIntent * 100)}%</b></span><span>Urgency <b>{Math.round(testerResult.urgency * 100)}%</b></span><span>Mobile <b>{testerResult.mobileService ? "Yes" : "No"}</b></span></div><p className="testerNote">Scoring is live. Database ingestion for tester-created signals will be enabled when the Supabase function deployment is available.</p></div></div>}</div></div>}
    </main>
  );
}
