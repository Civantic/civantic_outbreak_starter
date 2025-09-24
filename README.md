# Civantic & OutbreakResponse – Starter Monorepo

Two sites:
- **apps/civantic-site** → Civantic LLC marketing/consulting
- **apps/outbreakresponse** → Food Safety Outbreaks dashboard (NM + US)

## Quick Start
1) Install pnpm: `npm i -g pnpm`
2) Install deps (root): `pnpm install`
3) Copy env: `cp .env.example .env`
4) Run either app:
   - Civantic: `pnpm dev:civantic`
   - OutbreakResponse: `pnpm dev:outbreak`
5) Open: http://localhost:3000 (civantic), http://localhost:3001 (outbreak)

## Environments
Create `.env` at root (or per-app) with (examples):
```
SUPABASE_URL=your-url
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Add email provider keys if needed later (Resend/Postmark).

## Deploy
- Recommended: **Vercel** (connect each app as its own project)
- Point GoDaddy DNS to Vercel (CNAME for `www`, A/ALIAS for apex)

## Repo Structure
```
apps/
  civantic-site/
  outbreakresponse/
packages/
  config/      # shared config (tailwind, eslint, tsconfig)
  ui/          # shared UI components
  data/        # shared types & utils
etl/
  scripts/     # starter ETL placeholders
db/
  schema.sql   # Supabase Postgres schema
```

## Milestones (Days 0–14)
- Day 0–1: repo, hosting, DNS
- Day 2–4: Civantic MVP pages
- Day 5–7: OutbreakResponse MVP with mock data
- Day 8–10: A11y + performance
- Day 11–14: ETL to live sources (FDA/USDA/CDC), NM per‑capita

## Model Tips (ChatGPT-5)
- Use **GPT‑5 Pro (Thinking)** for coding/long planning
- Switch to **GPT‑5 Auto** when you need web browsing/tool use
(You can switch models in the same chat.)

--
Owner: James Kaminski, Civantic LLC
