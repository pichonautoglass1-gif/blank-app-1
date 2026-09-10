import type { NormalizedSignal } from "../types";

type CommentThread = {
  id: string;
  snippet?: {
    videoId?: string;
    topLevelComment?: {
      id?: string;
      snippet?: {
        textOriginal?: string;
        authorChannelId?: { value?: string };
        publishedAt?: string;
      };
    };
  };
};

type CommentThreadResponse = {
  items?: CommentThread[];
  nextPageToken?: string;
  error?: { message?: string };
};

export async function fetchYouTubeCommentSignals(input: {
  videoId: string;
  searchTerms?: string;
  pageToken?: string | null;
  maxResults?: number;
}): Promise<{ signals: NormalizedSignal[]; nextPageToken?: string | null }> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not configured");

  const params = new URLSearchParams({
    part: "snippet",
    videoId: input.videoId,
    textFormat: "plainText",
    order: "time",
    maxResults: String(Math.max(1, Math.min(input.maxResults ?? 50, 100))),
    key,
  });
  if (input.searchTerms) params.set("searchTerms", input.searchTerms);
  if (input.pageToken) params.set("pageToken", input.pageToken);

  const response = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?${params.toString()}`, {
    cache: "no-store",
  });
  const payload = (await response.json()) as CommentThreadResponse;
  if (!response.ok) throw new Error(payload.error?.message || `YouTube API returned ${response.status}`);

  const signals = (payload.items ?? []).flatMap<NormalizedSignal>((thread) => {
    const comment = thread.snippet?.topLevelComment;
    const text = comment?.snippet?.textOriginal?.trim();
    if (!text) return [];
    const commentId = comment.id || thread.id;
    return [{
      provider: "youtube",
      externalId: commentId,
      sourceUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(input.videoId)}&lc=${encodeURIComponent(commentId)}`,
      authorPublicId: comment.snippet?.authorChannelId?.value ?? null,
      text,
      observedAt: comment.snippet?.publishedAt ?? new Date().toISOString(),
      metadata: { videoId: input.videoId, threadId: thread.id },
    }];
  });

  return { signals, nextPageToken: payload.nextPageToken ?? null };
}
