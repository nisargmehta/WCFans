# WCFans

WCFans is a responsive FIFA World Cup 2026 fan hub built with React and Tailwind CSS. It includes a live scores ticker, expandable match cards, an RSS-powered World Cup news feed, and a playful haircut tracker that follows the five-wins-in-a-row fan challenge.

The app reads fixtures, news, and tracker data from Supabase at runtime. The bundled `openfootball/worldcup.json` data is only used for seeding Supabase, not as a browser fallback. News comes from Supabase `news_articles`, populated by an RSS sync job. Fixture cards read Supabase `fixture_previews`, populated by a separate API-Football preview job.

## Supabase

The Supabase project URL is configured in `.env.example`. Add your public publishable key locally:

```bash
cp .env.example .env.local
```

Then set `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. The app also accepts the older `VITE_SUPABASE_ANON_KEY` name for compatibility.

Apply the migration in `supabase/migrations` to create:

- `news_articles`
- `fixtures`
- `fixture_previews`
- `standings`
- `haircut_tracker`

Seed local World Cup fixtures into Supabase:

```bash
SERVICE_ROLE_KEY=... npm run supabase:seed-fixtures
```

The local seed can bootstrap the `fixtures` table while API-Football data is unavailable. The app renders real rows from Supabase and does not synthesize fixture cards when the table is empty.

Run the football-data.org fixture sync once after deploying functions:

```bash
curl -X POST 'https://qhkglztddsowhgjqskqz.supabase.co/functions/v1/sync-fixtures' \
  -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Run it again when the knockout bracket starts resolving after June 27, 2026.

Deploy the Edge Functions:

```bash
supabase functions deploy sync-rss-news
supabase functions deploy sync-fixtures
supabase functions deploy sync-fixture-previews
supabase functions deploy sync-standings
```

Set function secrets:

```bash
supabase secrets set FOOTBALL_DATA_API_KEY=...
supabase secrets set SERVICE_ROLE_KEY=...
supabase secrets set FOOTBALL_DATA_COMPETITION_CODE=WC
supabase secrets set FOOTBALL_DATA_COMPETITION_ID=2000
supabase secrets set FOOTBALL_DATA_SEASON=2026
```

`FOOTBALL_DATA_COMPETITION_CODE`, `FOOTBALL_DATA_COMPETITION_ID`, and `FOOTBALL_DATA_SEASON` are optional for World Cup 2026 because the functions default to `WC`, `2000`, and `2026`.
`API_FOOTBALL_LEAGUE_ID` and `API_FOOTBALL_SEASON` are still used by `sync-fixture-previews` for the derived players-to-watch list. RSS feeds can be overridden with a comma-separated `RSS_FEEDS` secret.
`sync-standings` also derives the haircut challenge streaks from standings form and stores them in `haircut_tracker`.
The default RSS feeds are public ESPN, Guardian, and BBC football feeds. Fox Sports requires a partner key, and Feedspot is a feed directory page unless you configure a specific listed feed.

Enable schedules with `supabase/sql/schedules.sql`, replacing `YOUR_SUPABASE_FUNCTION_JWT` with the project's anon JWT or service-role JWT:

- `sync-rss-news`: every 3 hours
- `sync-fixture-previews`: every 6 hours
- `sync-standings`: daily

Do not schedule `sync-fixtures` daily during group-stage setup. If you want automated fixture refreshes once knockout teams start resolving, use `supabase/sql/knockout-fixture-refresh.sql` near June 27, 2026.

## Local Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm test
npm run lint
npm run build
```
