export type LeadStatus = "New" | "Contacted" | "Quoted" | "Booked" | "Won" | "Lost";

export type Lead = {
  id: string;
  score: number;
  service: string;
  city: string;
  source: string;
  sourceUrl?: string;
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

export type ScoreResult = {
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

export type DashboardBusiness = {
  id: string;
  name: string;
  industry: string;
  homeCity: string;
  state: string;
  territoryLabel: string;
};

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatAge(createdAt: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr`;
  return `${Math.floor(hours / 24)} d`;
}

export function dbStatusToUi(status: string): LeadStatus {
  switch (status) {
    case "contacted": return "Contacted";
    case "quoted": return "Quoted";
    case "booked": return "Booked";
    case "won": return "Won";
    case "lost": return "Lost";
    default: return "New";
  }
}

export function uiStatusToDb(status: LeadStatus) {
  return status.toLowerCase();
}
