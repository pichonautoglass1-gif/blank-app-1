import type { NormalizedSignal } from "../types";

type XPost = {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
};

type XSearchResponse = {
  data?: XPost[];
  meta?: { next_token?: string; newest_id?: string };
  errors?: Array<{ detail?: string; title?: string }>;
};

export async function searchXRecentPosts(input: {
  query: string;
  nextToken?: string | null;
  maxResults?: number;
}): Promise<{ signals: NormalizedSignal[]; nextToken?: string | null; newestId?: string | null }> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) throw new Error("X_BEARER_TOKEN is not configured");

  const params = new URLSearchParams({
    query: input.query,
    "tweet.fields": "author_id,created_at",
    max_results: String(Math.max(10, Math.min(input.maxResults ?? 25, 100))),
  });
  if (input.nextToken) params.set("next_token", input.nextToken);

  const response = await fetch(`https://api.x.com/2/tweets/search/recent?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const payload = (await response.json()) as XSearchResponse;
  if (!response.ok) {
    const detail = payload.errors?.map((item) => item.detail || item.title).filter(Boolean).join("; ");
    throw new Error(detail || `X API returned ${response.status}`);
  }

  const signals: NormalizedSignal[] = (payload.data ?? []).map((post) => ({
    provider: "x",
    externalId: post.id,
    sourceUrl: `https://x.com/i/web/status/${post.id}`,
    authorPublicId: post.author_id ?? null,
    text: post.text,
    observedAt: post.created_at ?? new Date().toISOString(),
    metadata: { ingestion: "recent_search" },
  }));

  return {
    signals,
    nextToken: payload.meta?.next_token ?? null,
    newestId: payload.meta?.newest_id ?? null,
  };
}
