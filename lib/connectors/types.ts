export type ConnectorProvider =
  | "x"
  | "facebook"
  | "instagram"
  | "threads"
  | "youtube"
  | "reddit"
  | "nextdoor"
  | "tiktok"
  | "linkedin";

export type ConnectorCapability =
  | "public_discovery"
  | "comments"
  | "mentions"
  | "messages"
  | "page_activity"
  | "search"
  | "webhooks"
  | "reply";

export type NormalizedSignal = {
  provider: ConnectorProvider;
  externalId: string;
  sourceUrl?: string | null;
  authorPublicId?: string | null;
  text: string;
  city?: string | null;
  state?: string | null;
  observedAt: string;
  metadata?: Record<string, unknown>;
};

export type ConnectorHealth = "available" | "approval_required" | "limited" | "coming_soon";

export type ConnectorDefinition = {
  provider: ConnectorProvider;
  label: string;
  shortLabel: string;
  description: string;
  health: ConnectorHealth;
  capabilities: ConnectorCapability[];
  priority: number;
  credentialEnv: string[];
  note: string;
};

export interface SignalConnector {
  provider: ConnectorProvider;
  validateConfiguration(): Promise<{ ok: boolean; missing: string[] }>;
  poll?(cursor?: string | null): Promise<{ signals: NormalizedSignal[]; cursor?: string | null }>;
  verifyWebhook?(request: Request): Promise<boolean>;
  parseWebhook?(request: Request): Promise<NormalizedSignal[]>;
}
