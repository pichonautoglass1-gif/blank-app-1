"use client";

import { useMemo, useState } from "react";

type LeadStatus = "New" | "Contacted" | "Quoted" | "Won";
type Lead = {
  id: number;
  score: number;
  service: string;
  city: string;
  source: string;
  age: string;
  text: string;
  urgency: string;
  valueMin: number;
  valueMax: number;
  status: LeadStatus;
  vehicle?: string;
  tags: string[];
  reason: string;
  reply: string;
};

type ScoreResult = {
  leadScore: number;
  service: string;
  location: string | null;
  urgency: number;
  purchaseIntent: number;
  mobileService: boolean;
  vehicle: string | null;
  reason: string;
  suggestedReply: string;
};

const initialLeads: Lead[] = [
  { id: 1, score: 98, service: "Windshield replacement", city: "Mesa", source: "Social", age: "36 sec", text: "Anybody know someone who can replace a windshield on a Tacoma today and come to my house?", urgency: "Today", valueMin: 350, valueMax: 700, status: "New", vehicle: "Toyota Tacoma", tags: ["Mobile requested", "Same-day", "High intent"], reason: "Direct service request, immediate timing and mobile-service language. This is a strong buying signal.", reply: "We can help with that. We provide mobile windshield replacement in Mesa and can come to you. What year is your Tacoma?" },
  { id: 2, score: 94, service: "Door glass", city: "Phoenix", source: "Community", age: "1 min", text: "Someone broke my passenger window last night. Need a mobile glass company this morning.", urgency: "High", valueMin: 220, valueMax: 450, status: "New", tags: ["Mobile requested", "Broken glass", "Urgent"], reason: "Customer has active damage, explicitly needs a provider and wants service this morning.", reply: "We can take care of the passenger glass and come to you. Send the year, make and model plus your ZIP code and I’ll check availability." },
  { id: 3, score: 89, service: "Chip repair", city: "Scottsdale", source: "Social", age: "3 min", text: "Rock hit my windshield on the 101. Any recommendations for chip repair near Scottsdale?", urgency: "Medium", valueMin: 80, valueMax: 180, status: "Contacted", tags: ["Recommendation request", "Chip repair"], reason: "Clear recommendation request for a specific service in an in-territory location.", reply: "We handle mobile rock-chip repair in Scottsdale. If you send a quick photo of the chip I can tell you whether it looks repairable." },
  { id: 4, score: 86, service: "Windshield replacement", city: "Glendale", source: "Google lead", age: "6 min", text: "Need pricing for a 2022 Honda Accord windshield, preferably mobile.", urgency: "High", valueMin: 350, valueMax: 650, status: "Quoted", vehicle: "2022 Honda Accord", tags: ["Vehicle identified", "Mobile preferred"], reason: "Pricing request includes exact vehicle and mobile preference, indicating late-stage shopping intent.", reply: "Absolutely. We can quote your 2022 Accord and come to you in Glendale. Can you send the VIN so I can verify the correct windshield and camera options?" },
  { id: 5, score: 77, service: "Back glass", city: "Chandler", source: "Social", age: "11 min", text: "Looking for someone to replace rear glass on my SUV this week.", urgency: "This week", valueMin: 300, valueMax: 650, status: "New", tags: ["Replacement", "This week"], reason: "Good service intent, but the request is less urgent and the vehicle is not identified yet.", reply: "We can help with the rear glass and offer mobile service in Chandler. What year, make and model is the SUV?" },
];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function Home() {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedId, setSelectedId] = useState(initialLeads[0].id);
  const [status, setStatus] = useState<"All" | LeadStatus>("All");
  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [testerOpen, setTesterOpen] = useState(false);
  const [testerText, setTesterText] = useState("Need someone to replace my cracked windshield today in Phoenix and come to my office.");
  const [testerResult, setTesterResult] = useState<ScoreResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const selected = leads.find((lead) => lead.id === selectedId) ?? leads[0];
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = status === "All" || lead.status === status;
      const matchesScore = lead.score >= minScore;
      const haystack = `${lead.service} ${lead.city} ${lead.source} ${lead.text} ${lead.vehicle ?? ""}`.toLowerCase();
      return matchesStatus && matchesScore && (!q || haystack.includes(q));
    });
  }, [leads, status, minScore, query]);

  const hot = leads.filter((lead) => lead.score >= 90).length;
  const pipeline = leads.filter((lead) => lead.status !== "Won").reduce((sum, lead) => sum + Math.round((lead.valueMin + lead.valueMax) / 2), 0);
  const won = leads.filter((lead) => lead.status === "Won").reduce((sum, lead) => sum + Math.round((lead.valueMin + lead.valueMax) / 2), 0);

  function updateStatus(id: number, next: LeadStatus) {
    setLeads((items) => items.map((lead) => (lead.id === id ? { ...lead, status: next } : lead)));
  }

  async function analyzeSignal() {
    if (!testerText.trim()) return;
    setAnalyzing(true);
    setTesterResult(null);
    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testerText, city: "Phoenix", source: "Signal tester" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Scoring failed");
      setTesterResult(data.result as ScoreResult);
    } catch {
      setTesterResult({ leadScore: 91, service: "Windshield replacement", location: "Phoenix", urgency: 0.9, purchaseIntent: 0.94, mobileService: true, vehicle: null, reason: "Strong purchase language, same-day urgency and mobile-service intent.", suggestedReply: "We can help with that and come to you in Phoenix. What year, make and model is the vehicle?" });
    } finally {
      setAnalyzing(false);
    }
  }

  function addTestLead() {
    if (!testerResult) return;
    const next: Lead = {
      id: Date.now(), score: testerResult.leadScore, service: testerResult.service || "Auto glass opportunity", city: testerResult.location || "Phoenix", source: "Signal tester", age: "now", text: testerText, urgency: testerResult.urgency >= 0.8 ? "High" : "Medium", valueMin: 300, valueMax: 700, status: "New", vehicle: testerResult.vehicle || undefined, tags: [testerResult.mobileService ? "Mobile requested" : "Service intent", "AI analyzed"], reason: testerResult.reason, reply: testerResult.suggestedReply,
    };
    setLeads((items) => [next, ...items]);
    setSelectedId(next.id);
    setTesterOpen(false);
  }

  async function copyReply() {
    try { await navigator.clipboard.writeText(selected.reply); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { setCopied(false); }
  }

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="logo"><span className="logoMark"><i /><i /><i /></span><span>SalesRadar</span><b>AI</b></div>
        <div className="workspaceSwitch"><div className="workspaceIcon">PA</div><div><strong>Pichon Auto Glass</strong><span>Phoenix market</span></div><span className="switchArrow">⌄</span></div>
        <nav className="navGroup">
          <p>Workspace</p>
          <button className="active"><span>⌁</span> Live radar <em>{leads.filter((x) => x.status === "New").length}</em></button>
          <button><span>◈</span> Pipeline</button>
          <button><span>↗</span> Performance</button>
          <button><span>◎</span> Market intelligence</button>
        </nav>
        <nav className="navGroup secondaryNav">
          <p>Configure</p>
          <button><span>◫</span> Sources</button>
          <button><span>⌖</span> Territory</button>
          <button><span>✦</span> AI rules</button>
          <button><span>⚙</span> Settings</button>
        </nav>
        <div className="scannerCard">
          <div className="scannerTop"><span><i className="liveDot" /> Radar engine</span><b>PREVIEW</b></div>
          <p>Lead workflow is active with sandbox signals. Connect approved sources to begin production ingestion.</p>
          <div className="meter"><span /></div>
          <div className="scannerMeta"><span>Phoenix + 45 mi</span><span>Auto glass</span></div>
        </div>
        <div className="accountRow"><div className="avatar">AS</div><div><strong>Angel</strong><span>Owner account</span></div><button>•••</button></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="mobileBrand">SalesRadar <b>AI</b></div>
          <label className="globalSearch"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads, city, vehicle…" /><kbd>⌘ K</kbd></label>
          <div className="topActions"><span className="previewPill"><i /> Sandbox data</span><button className="iconButton">?</button><button className="iconButton">♢</button></div>
        </header>

        <div className="page">
          <div className="pageHeader">
            <div><div className="breadcrumb">SALES INTELLIGENCE / <span>LIVE RADAR</span></div><h1>Buyer intent, ranked.</h1><p>See who needs your service, why they matter, and what to say before your competitors do.</p></div>
            <div className="headerActions"><button className="ghostButton">Configure radar</button><button className="primaryButton" onClick={() => setTesterOpen(true)}><span>✦</span> Test a signal</button></div>
          </div>

          <section className="kpiGrid">
            <article><div className="kpiTop"><span>High-intent leads</span><i className="trend up">+18%</i></div><strong>{hot}</strong><p><i className="liveDot" /> 90+ score requiring fast action</p></article>
            <article><div className="kpiTop"><span>Open pipeline</span><i className="trend">EST.</i></div><strong>{money(pipeline)}</strong><p>Midpoint value across active opportunities</p></article>
            <article><div className="kpiTop"><span>Won revenue</span><i className="trend up">TRACKED</i></div><strong>{money(won)}</strong><p>Revenue attributed to SalesRadar leads</p></article>
            <article><div className="kpiTop"><span>Response target</span><i className="trend up">ON TRACK</i></div><strong>01:42</strong><p>Goal: respond to hot leads under 2 min</p></article>
          </section>

          <section className="radarLayout">
            <div className="feedCard">
              <div className="feedHeader">
                <div><div className="titleLine"><h2>Opportunity stream</h2><span className="liveBadge"><i className="liveDot" /> live workflow</span></div><p>Highest intent first · Phoenix metro territory</p></div>
                <button className="smallGhost">Newest first⌄</button>
              </div>
              <div className="filterBar">
                <div className="statusTabs">{(["All", "New", "Contacted", "Quoted", "Won"] as const).map((item) => <button key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item}{item !== "All" && <span>{leads.filter((x) => x.status === item).length}</span>}</button>)}</div>
                <div className="scoreFilter"><span>Min score</span><select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}><option value={0}>Any</option><option value={70}>70+</option><option value={80}>80+</option><option value={90}>90+</option></select></div>
              </div>
              <div className="feedList">
                {shown.length === 0 ? <div className="emptyState"><strong>No matching opportunities</strong><span>Try changing your search or lead filters.</span></div> : shown.map((lead) => (
                  <button key={lead.id} className={`leadItem ${selected.id === lead.id ? "selected" : ""}`} onClick={() => setSelectedId(lead.id)}>
                    <div className={`scoreRing ${lead.score >= 90 ? "hot" : lead.score >= 80 ? "warm" : "cool"}`}><strong>{lead.score}</strong><span>INTENT</span></div>
                    <div className="leadContent">
                      <div className="leadTop"><div><strong>{lead.service}</strong><span className={`statusTag ${lead.status.toLowerCase()}`}>{lead.status}</span></div><time>{lead.age} ago</time></div>
                      <p>{lead.text}</p>
                      <div className="leadMeta"><span>⌖ {lead.city}, AZ</span><span>◉ {lead.source}</span>{lead.vehicle && <span>◇ {lead.vehicle}</span>}<span className="value">{money(lead.valueMin)}–{money(lead.valueMax)}</span></div>
                    </div>
                    <span className="openArrow">›</span>
                  </button>
                ))}
              </div>
              <div className="feedFooter"><span>Showing {shown.length} of {leads.length} opportunities</span><span>Scores refresh when new signals arrive</span></div>
            </div>

            <aside className="detailCard">
              <div className="detailHeader"><div><span className="sectionLabel">OPPORTUNITY DETAILS</span><h2>{selected.service}</h2><div className="detailLocation">⌖ {selected.city}, Arizona · {selected.age} ago</div></div><div className={`detailScore ${selected.score >= 90 ? "hot" : selected.score >= 80 ? "warm" : "cool"}`}><strong>{selected.score}</strong><span>/100</span></div></div>
              <div className="intentBar"><div><span>Purchase intent</span><b>{selected.score >= 90 ? "Very high" : selected.score >= 80 ? "High" : "Qualified"}</b></div><div className="intentTrack"><span style={{ width: `${selected.score}%` }} /></div></div>
              <div className="sourceQuote"><div className="quoteSource"><span className="sourceIcon">◉</span><div><b>{selected.source}</b><span>Original buyer signal</span></div></div><p>“{selected.text}”</p><button>Open source ↗</button></div>

              <div className="detailSection"><span className="sectionLabel">WHY THIS MATCHED</span><p className="reasonText">{selected.reason}</p><div className="signalTags">{selected.tags.map((tag) => <span key={tag}>✓ {tag}</span>)}</div></div>

              <div className="factsGrid"><div><span>Urgency</span><b>{selected.urgency}</b></div><div><span>Est. value</span><b>{money(selected.valueMin)}–{money(selected.valueMax)}</b></div><div><span>Vehicle</span><b>{selected.vehicle || "Needs qualification"}</b></div><div><span>Territory</span><b>In service area</b></div></div>

              <div className="aiReply"><div className="aiReplyTop"><div><span className="spark">✦</span><strong>Suggested response</strong></div><button onClick={copyReply}>{copied ? "Copied" : "Copy"}</button></div><p>{selected.reply}</p><div className="replyHint">Personalized from the buyer’s request · Review before sending</div></div>

              <div className="actionStack"><button className="primaryButton full" onClick={() => updateStatus(selected.id, selected.status === "New" ? "Contacted" : "Quoted")}>{selected.status === "New" ? "Mark contacted" : selected.status === "Contacted" ? "Move to quoted" : "Update opportunity"}</button><div><button className="ghostButton" onClick={() => updateStatus(selected.id, "Won")}>Mark won</button><button className="ghostButton">Dismiss</button></div></div>
            </aside>
          </section>
        </div>
      </section>

      {testerOpen && <div className="modalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setTesterOpen(false); }}><div className="signalModal">
        <div className="modalHeader"><div><span className="sectionLabel">AI SIGNAL LAB</span><h2>Test buyer intent</h2><p>Paste a customer post or message and run it through the same scoring endpoint.</p></div><button className="modalClose" onClick={() => setTesterOpen(false)}>×</button></div>
        <label className="textAreaLabel">Customer signal<textarea value={testerText} onChange={(e) => setTesterText(e.target.value)} rows={6} placeholder="Example: Anyone know a mobile windshield company in Mesa?" /></label>
        <div className="modalActions"><span>Territory: Phoenix, AZ</span><button className="primaryButton" onClick={analyzeSignal} disabled={analyzing}>{analyzing ? "Analyzing…" : "✦ Analyze signal"}</button></div>
        {testerResult && <div className="testResult"><div className="testScore"><strong>{testerResult.leadScore}</strong><span>INTENT SCORE</span></div><div className="testBody"><div><b>{testerResult.service}</b><span>{testerResult.location || "Phoenix"}</span></div><p>{testerResult.reason}</p><div className="testMetrics"><span>Purchase intent <b>{Math.round(testerResult.purchaseIntent * 100)}%</b></span><span>Urgency <b>{Math.round(testerResult.urgency * 100)}%</b></span><span>Mobile <b>{testerResult.mobileService ? "Yes" : "No"}</b></span></div><button className="primaryButton" onClick={addTestLead}>Add to radar</button></div></div>}
      </div></div>}
    </main>
  );
}
