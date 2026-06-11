# WCFans

WCFans is a FIFA World Cup 2026 fan hub for following matches, news, standings, and fan rituals in one lightweight web app.

## Features

- Live and upcoming match cards with scores, match status, kickoff times, teams, and quick access to the full match view.
- Full schedule view that auto-scrolls to the current match date and keeps navigation back to the match hub within reach.
- Match detail pages with officials, score notes, stats, timelines, lineups, benches, and provider-delay messaging when feeds lag behind the game.
- World Cup news feed powered by synced RSS sources and diversified so one publisher does not dominate the page.
- Group standings and a playful haircut tracker for the five-wins-in-a-row fan challenge.
- Dark mode, responsive layouts, click tracking, and share-ready fan-defense/haircut moments.

## Screenshots

Screenshots coming soon.

## Tech Architecture

- **Frontend:** React, Vite, and Tailwind CSS render the fan hub as a responsive single-page app.
- **Data backend:** Supabase stores fixtures, match details, news articles, standings, haircut tracker state, fixture previews, and analytics events.
- **Edge functions:** Supabase Edge Functions sync fixtures, match details, standings, RSS news, and preview data from external football/news feeds.
- **Runtime data flow:** The browser reads public Supabase REST endpoints, normalizes fixture rows into app-friendly match objects, and polls during active match windows so late provider updates can appear without a page reload.
- **Testing:** Vitest and Testing Library cover dashboard shaping, schedule behavior, match cards, detail views, standings, news, analytics, and fan challenge flows.
