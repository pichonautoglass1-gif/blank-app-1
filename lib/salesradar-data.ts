export type LeadStatus = "New" | "Contacted" | "Quoted" | "Won";

export type Lead = {
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

export const initialLeads: Lead[] = [
  {
    id: 1,
    score: 98,
    service: "Windshield replacement",
    city: "Mesa",
    source: "Social",
    age: "36 sec",
    text: "Anybody know someone who can replace a windshield on a Tacoma today and come to my house?",
    urgency: "Today",
    valueMin: 350,
    valueMax: 700,
    status: "New",
    vehicle: "Toyota Tacoma",
    tags: ["Mobile requested", "Same-day", "High intent"],
    reason: "Direct service request, immediate timing and mobile-service language. This is a strong buying signal.",
    reply: "We can help with that. We provide mobile windshield replacement in Mesa and can come to you. What year is your Tacoma?",
  },
  {
    id: 2,
    score: 94,
    service: "Door glass",
    city: "Phoenix",
    source: "Community",
    age: "1 min",
    text: "Someone broke my passenger window last night. Need a mobile glass company this morning.",
    urgency: "High",
    valueMin: 220,
    valueMax: 450,
    status: "New",
    tags: ["Mobile requested", "Broken glass", "Urgent"],
    reason: "Customer has active damage, explicitly needs a provider and wants service this morning.",
    reply: "We can take care of the passenger glass and come to you. Send the year, make and model plus your ZIP code and I’ll check availability.",
  },
  {
    id: 3,
    score: 89,
    service: "Chip repair",
    city: "Scottsdale",
    source: "Social",
    age: "3 min",
    text: "Rock hit my windshield on the 101. Any recommendations for chip repair near Scottsdale?",
    urgency: "Medium",
    valueMin: 80,
    valueMax: 180,
    status: "Contacted",
    tags: ["Recommendation request", "Chip repair"],
    reason: "Clear recommendation request for a specific service in an in-territory location.",
    reply: "We handle mobile rock-chip repair in Scottsdale. If you send a quick photo of the chip I can tell you whether it looks repairable.",
  },
  {
    id: 4,
    score: 86,
    service: "Windshield replacement",
    city: "Glendale",
    source: "Google lead",
    age: "6 min",
    text: "Need pricing for a 2022 Honda Accord windshield, preferably mobile.",
    urgency: "High",
    valueMin: 350,
    valueMax: 650,
    status: "Quoted",
    vehicle: "2022 Honda Accord",
    tags: ["Vehicle identified", "Mobile preferred"],
    reason: "Pricing request includes exact vehicle and mobile preference, indicating late-stage shopping intent.",
    reply: "Absolutely. We can quote your 2022 Accord and come to you in Glendale. Can you send the VIN so I can verify the correct windshield and camera options?",
  },
  {
    id: 5,
    score: 77,
    service: "Back glass",
    city: "Chandler",
    source: "Social",
    age: "11 min",
    text: "Looking for someone to replace rear glass on my SUV this week.",
    urgency: "This week",
    valueMin: 300,
    valueMax: 650,
    status: "New",
    tags: ["Replacement", "This week"],
    reason: "Good service intent, but the request is less urgent and the vehicle is not identified yet.",
    reply: "We can help with the rear glass and offer mobile service in Chandler. What year, make and model is the SUV?",
  },
];

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
