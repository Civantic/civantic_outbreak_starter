Starter ETL placeholders. Replace with production scripts.

Suggested flow:
- Fetch FDA/USDA/CDC JSON/CSV
- Normalize to recalls.csv / outbreaks.csv shape
- Upsert into Supabase via REST or pg client
- Schedule nightly with Vercel Cron
