# SalesRadar AI

SalesRadar AI is a multi-tenant buyer-intent intelligence platform for local service businesses. It normalizes permitted signals from social/community APIs, scores purchase intent with AI, territory-matches qualified opportunities, and gives business owners a fast sales workflow.

The first vertical is Phoenix auto glass, but the architecture is industry-agnostic.

## Production core

- Next.js 16 + React 19 + TypeScript
- Supabase Auth with SSR cookie sessions
- Postgres + Row Level Security for tenant isolation
- Guided business/territory onboarding
- Server-rendered, business-scoped lead dashboard
- Persistent lead lifecycle: New → Contacted → Quoted → Booked → Won/Lost
- AI intent scoring endpoint with local heuristic fallback
- Search, score filtering, pipeline value and revenue attribution
- Dedicated Sources control center
- Normalized connector contracts for X, Facebook, Instagram, Threads, YouTube, Reddit, Nextdoor, TikTok and LinkedIn
- X recent-search adapter
- YouTube comment adapter
- Meta webhook signature verification + signal normalization
- CI: install, TypeScript and optimized Next.js production build

## Signal architecture

```text
Approved platform API / webhook
        ↓
Provider adapter
        ↓
NormalizedSignal
        ↓
Dedupe + secure raw storage
        ↓
AI Intent Engine
        ↓
Territory / business matching
        ↓
Qualified lead
        ↓
SalesRadar dashboard + notifications
```

Connectors intentionally use first-party APIs and authorized account access. The product does not depend on unauthorized private-group scraping or indiscriminate auto-replies.

## Supported source strategy

1. X — public intent discovery
2. Instagram — professional-account comments, mentions and messages
3. Facebook — Page activity and Messenger
4. Threads — public/account discovery where permitted
5. YouTube — search and comments
6. Reddit — commercial approval required before production use
7. Nextdoor — partner/API approval required
8. TikTok — connected-account signals; limited broad discovery
9. LinkedIn — primarily B2B/company signals

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Required configuration

Populate `.env.local` from `.env.example`. Public Supabase configuration belongs in `NEXT_PUBLIC_*` variables. API tokens, OAuth secrets and `OPENAI_API_KEY` are server-only and must never be committed.

## Remaining launch work

- Deploy the authenticated server-side signal-ingestion function
- Add production OAuth/app credentials for the first live providers
- Connect notifications
- Deploy the Next.js application to a production host
- Add billing and plan limits
- Add connector observability, retries, rate-limit handling and dead-letter processing

## Security principles

- RLS isolates each business workspace
- raw platform signals remain server-only
- no secret API keys in browser bundles
- webhook signatures are verified where supported
- source URLs and platform attribution are retained
- human review remains in control of outbound responses
