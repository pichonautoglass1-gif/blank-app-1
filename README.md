# SalesRadar AI

AI buyer-intent radar for local service businesses. This MVP is configured around Phoenix auto glass as the first vertical.

## Included in this branch

- Responsive Next.js dashboard
- Live-lead style feed with lead scoring, status filters, territory/source metadata, and suggested replies
- `/api/score` route with OpenAI Responses API integration and a heuristic fallback
- Supabase schema for businesses, territories, signals, and leads
- Environment variable template

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

Set `OPENAI_API_KEY` to enable AI scoring. If it is absent, the scoring endpoint stays functional using the local heuristic scorer. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` after creating the Supabase project.

## Next integration milestones

1. Apply `supabase/schema.sql` to the connected Supabase project.
2. Replace seeded demo leads with Supabase reads/realtime subscriptions.
3. Add the first approved/public signal connector and normalize incoming posts into `signals`.
4. Route each signal through `/api/score`, territory-match it, and create a `leads` record.
5. Add authentication, notifications, and subscription billing.

Important: platform connectors should use approved APIs and permissions rather than unauthorized scraping.
