export type LeadSignal = {
  text: string;
  source?: string;
  city?: string;
};

export type LeadScore = {
  industry: string;
  service: string;
  purchaseIntent: number;
  urgency: number;
  leadScore: number;
  location: string | null;
  mobileService: boolean;
  vehicle: string | null;
  reason: string;
  suggestedReply: string;
};

const urgent = ["today", "asap", "now", "emergency", "right away", "this morning", "this afternoon"];
const purchase = ["need", "looking for", "recommend", "who can", "anyone know", "quote", "replace", "repair", "fix"];
const autoGlass = ["windshield", "auto glass", "car window", "door glass", "quarter glass", "back glass", "rock chip"];

export function heuristicScore(signal: LeadSignal): LeadScore {
  const text = signal.text.toLowerCase();
  const purchaseHits = purchase.filter((word) => text.includes(word)).length;
  const urgentHits = urgent.filter((word) => text.includes(word)).length;
  const glassHits = autoGlass.filter((word) => text.includes(word)).length;
  const purchaseIntent = Math.min(0.98, 0.2 + purchaseHits * 0.18 + glassHits * 0.17);
  const urgency = Math.min(0.98, 0.35 + urgentHits * 0.3);
  const leadScore = Math.round(Math.min(99, purchaseIntent * 72 + urgency * 23 + (signal.city ? 5 : 0)));

  const service = text.includes("chip") ? "Chip repair" : text.includes("door") || text.includes("window") ? "Door / side glass" : "Windshield replacement";

  return {
    industry: "Auto Glass",
    service,
    purchaseIntent: Number(purchaseIntent.toFixed(2)),
    urgency: Number(urgency.toFixed(2)),
    leadScore,
    location: signal.city ?? null,
    mobileService: /come to|mobile|house|home|work/.test(text),
    vehicle: null,
    reason: "Matched purchase language, auto-glass service terms, urgency, and territory context.",
    suggestedReply: "We can help with that. We offer mobile auto glass service in the Phoenix area. What year, make and model is the vehicle?",
  };
}
