import type { ConnectorProvider, NormalizedSignal } from "../types";

type MetaProvider = Extract<ConnectorProvider, "facebook" | "instagram" | "threads">;

type MetaWebhookPayload = {
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: Array<Record<string, unknown>>;
    changes?: Array<{ field?: string; value?: Record<string, unknown> }>;
  }>;
};

function pickText(value: Record<string, unknown>) {
  const direct = [value.message, value.text, value.comment, value.caption];
  for (const item of direct) if (typeof item === "string" && item.trim()) return item.trim();

  const message = value.message;
  if (message && typeof message === "object" && "text" in message && typeof (message as { text?: unknown }).text === "string") {
    return (message as { text: string }).text.trim();
  }
  return "";
}

export async function verifyMetaSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signatureHeader?.startsWith("sha256=")) return false;

  const expectedHex = signatureHeader.slice(7).toLowerCase();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const actualHex = Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");

  if (actualHex.length !== expectedHex.length) return false;
  let mismatch = 0;
  for (let i = 0; i < actualHex.length; i += 1) mismatch |= actualHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  return mismatch === 0;
}

export function normalizeMetaWebhook(payload: MetaWebhookPayload, provider: MetaProvider): NormalizedSignal[] {
  const signals: NormalizedSignal[] = [];

  for (const entry of payload.entry ?? []) {
    const observedAt = entry.time ? new Date(entry.time * 1000).toISOString() : new Date().toISOString();

    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      const text = pickText(value);
      if (!text) continue;
      const externalId = String(value.id ?? value.comment_id ?? value.mid ?? `${entry.id ?? "meta"}-${change.field ?? "event"}-${observedAt}`);
      signals.push({
        provider,
        externalId,
        authorPublicId: typeof value.from === "string" ? value.from : null,
        text,
        observedAt,
        metadata: { entryId: entry.id, field: change.field, event: "change" },
      });
    }

    for (const event of entry.messaging ?? []) {
      const message = event.message;
      const messageRecord = message && typeof message === "object" ? (message as Record<string, unknown>) : {};
      const text = pickText({ ...event, message: messageRecord });
      if (!text) continue;
      const sender = event.sender && typeof event.sender === "object" ? (event.sender as Record<string, unknown>).id : null;
      const externalId = String(messageRecord.mid ?? `${entry.id ?? "meta"}-message-${observedAt}-${signals.length}`);
      signals.push({
        provider,
        externalId,
        authorPublicId: typeof sender === "string" ? sender : null,
        text,
        observedAt,
        metadata: { entryId: entry.id, event: "messaging" },
      });
    }
  }

  return signals;
}
