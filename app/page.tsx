"use client";

import { useMemo, useState } from "react";

type Lead = {
  id: number;
  score: number;
  service: string;
  city: string;
  source: string;
  age: string;
  text: string;
  urgency: string;
  value: string;
  status: "New" | "Contacted" | "Won";
};

const seedLeads: Lead[] = [
  { id: 1, score: 98, service: "Windshield replacement", city: "Mesa", source: "Social", age: "36 sec", text: "Anybody know someone who can replace a windshield on a Tacoma today and come to my house?", urgency: "Today", value: "$350–$700", status: "New" },
  { id: 2, score: 94, service: "Door glass", city: "Phoenix", source: "Community", age: "1 min", text: "Someone broke my passenger window last night. Need a mobile glass company this morning.", urgency: "High", value: "$220–$450", status: "New" },
  { id: 3, score: 89, service: "Windshield chip", city: "Scottsdale", source: "Social", age: "3 min", text: "Rock hit my windshield on the 101. Any recommendations for chip repair near Scottsdale?", urgency: "Medium", value: "$80–$180", status: "Contacted" },
  { id: 4, score: 84, service: "Windshield replacement", city: "Glendale", source: "Google lead", age: "6 min", text: "Need pricing for a 2022 Honda Accord windshield, preferably mobile.", urgency: "High", value: "$350–$650", status: "New" },
  { id: 5, score: 72, service: "Back glass", city: "Chandler", source: "Social", age: "11 min", text: "Looking for someone to replace rear glass on my SUV this week.", urgency: "This week", value: "$300–$650", status: "New" },
];

export default function Home() {
  const [leads, setLeads] = useState(seedLeads);
  const [selected, setSelected] = useState(seedLeads[0]);
  const [filter, setFilter] = useState("All");

  const shown = useMemo(() => filter === "All" ? leads : leads.filter((lead) => lead.status === filter), [leads, filter]);
  const hot = leads.filter((lead) => lead.score >= 90).length;
  const pipeline = leads.reduce((sum, lead) => sum + Number(lead.value.replace(/[^0-9–]/g, "").split("–")[1] || 0), 0);

  function markContacted(id: number) {
    setLeads((items) => items.map((lead) => lead.id === id ? { ...lead, status: "Contacted" } : lead));
    setSelected((lead) => lead.id === id ? { ...lead, status: "Contacted" } : lead);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="radarDot" />SalesRadar <b>AI</b></div>
        <p className="eyebrow">PHOENIX AUTO GLASS</p>
        <nav>
          <button className="navActive">⌁ Live Radar <span>{leads.length}</span></button>
          <button>◎ Opportunities</button>
          <button>◫ Pipeline</button>
          <button>↗ Revenue</button>
          <button>⚙ Territory & Rules</button>
        </nav>
        <div className="sourceCard">
          <div className="statusLine"><span className="pulse" /> Scanner active</div>
          <p>Watching Phoenix metro for high-intent auto glass demand.</p>
          <div className="sourceRow"><span>Social signals</span><b>LIVE</b></div>
          <div className="sourceRow"><span>Google intelligence</span><b>READY</b></div>
        </div>
        <div className="profile"><div className="avatar">PA</div><div><b>Pichon Auto Glass</b><small>Phoenix, Arizona</small></div></div>
      </aside>

      <section className="workspace">
        <header>
          <div><p className="eyebrow">BUYER INTENT COMMAND CENTER</p><h1>Live Lead Radar</h1><p className="sub">Customers looking for auto glass right now, ranked by purchase intent.</p></div>
          <button className="primary">+ Add source</button>
        </header>

        <div className="metrics">
          <article><span>Hot leads</span><strong>{hot}</strong><small>90+ intent score</small></article>
          <article><span>Opportunities today</span><strong>{leads.length}</strong><small>Across Phoenix metro</small></article>
          <article><span>Potential pipeline</span><strong>${pipeline.toLocaleString()}+</strong><small>Estimated upper range</small></article>
          <article><span>Avg response window</span><strong>1:42</strong><small>Target: under 2 min</small></article>
        </div>

        <div className="mainGrid">
          <div className="feedPanel">
            <div className="panelTop"><div><h2>Incoming opportunities</h2><p>AI-ranked in real time</p></div><div className="filters">{["All","New","Contacted","Won"].map((item) => <button key={item} className={filter === item ? "filterActive" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
            <div className="feed">
              {shown.map((lead) => (
                <button key={lead.id} className={`leadRow ${selected.id === lead.id ? "leadSelected" : ""}`} onClick={() => setSelected(lead)}>
                  <div className={`score ${lead.score >= 90 ? "scoreHot" : lead.score >= 80 ? "scoreWarm" : ""}`}>{lead.score}</div>
                  <div className="leadBody"><div className="leadHeading"><b>{lead.service}</b><span>{lead.age} ago</span></div><p>{lead.text}</p><div className="tags"><span>{lead.city}</span><span>{lead.source}</span><span>{lead.status}</span></div></div>
                  <div className="chevron">›</div>
                </button>
              ))}
            </div>
          </div>

          <aside className="detailPanel">
            <div className="detailHero"><div className={`bigScore ${selected.score >= 90 ? "scoreHot" : "scoreWarm"}`}>{selected.score}</div><div><p className="eyebrow">LEAD SCORE</p><h2>{selected.service}</h2><span className="hotLabel">{selected.score >= 90 ? "HOT LEAD" : "QUALIFIED"}</span></div></div>
            <div className="quote">“{selected.text}”</div>
            <div className="facts"><div><span>Location</span><b>{selected.city}, AZ</b></div><div><span>Urgency</span><b>{selected.urgency}</b></div><div><span>Potential value</span><b>{selected.value}</b></div><div><span>Source</span><b>{selected.source}</b></div></div>
            <div className="aiBox"><div className="aiTitle"><span>✦</span> AI recommendation</div><p>This looks like strong purchase intent. Respond now and qualify the vehicle before discussing final pricing.</p><div className="reply">We can help with that. We offer mobile auto glass service in the Phoenix area. What year, make and model is the vehicle?</div></div>
            <button className="primary wide" onClick={() => markContacted(selected.id)}>Mark contacted</button>
            <button className="secondary wide">Open original post ↗</button>
          </aside>
        </div>
      </section>
    </main>
  );
}
