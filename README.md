# ICE.UA — Ukrainian Hockey Analytics

Interactive, mobile-friendly Ukrainian hockey analytics dashboard.

## What works today
- Filters by region, position and search by name, club, league or country.
- Sort by points, goals, games, points per game, or name.
- Player profiles, line chart, league distribution and aggregate metrics.
- JSON-fed website with reload button; daily GitHub Actions sync template.

**Important:** `data/players.json` contains entirely **fictional demonstration entries**. Names, affiliations, season numbers and statistics are not asserted facts. It is not a live all-player database.

## Run locally

```bash
cd ukrainian-hockey-tracker
python -m http.server 8000
```
Open http://localhost:8000 . The site can also be hosted on GitHub Pages, Netlify, Vercel or any static host.

## Set up daily verified data
1. Acquire an appropriate licensed statistics source covering the leagues you need. EliteProspects offers an API: https://developer.eliteprospects.com/ (check subscription terms and publication rights).
2. Implement or deploy a **server-side feed adapter** that fetches authorized provider data, identifies **Ukrainian nationality**, maps all required active club rosters and game stats, handles goalie data, normalizes duplicate player identities and seasons, and returns JSON of the shape described below. This integration is **not provided** by the demo because API credentials and detailed endpoint access are unavailable.
3. In GitHub repository Settings → Secrets and variables → Actions, set `STATISTICS_FEED_URL` (an endpoint to your validated JSON feed), and optional `STATISTICS_FEED_TOKEN`. Never put secrets in browser-side files.
4. Enable GitHub Actions; `.github/workflows/daily-sync.yml` requests the feed daily (06:15 UTC) and commits `data/players.json` if it changes. GitHub may delay scheduled jobs.
5. Publish the repository with GitHub Pages, or configure your static host to redeploy on commits. Automatic daily updates require the external feed to stay available and have an appropriate usage license.

## Feed example

```json
{
  "meta": {"season":"2026/27", "source":"Licensed statistics provider"},
  "players": [
    {"id":"provider-id-123", "name":"Example", "position":"Нападник", "region":"Європа", "country":"Швеція", "league":"SHL", "club":"Example Club", "gp":12, "g":4, "a":6, "plusMinus":2, "age":23, "trend":[0,1,2,3,4,6,7,8,10]}
  ]
}
```

The feed returns all tracked players, including goalies; `trend` may be omitted, but including nine cumulative checkpoints yields better visual charts. Live feed freshness and completeness depend on your licensed source, and the dashboard never guarantees worldwide coverage on its own.

## Data-provider notes
- EliteProspects: https://developer.eliteprospects.com/
- NHL's public endpoints cover NHL data but do not suffice for comprehensive European and minor-league coverage: https://api-web.nhle.com/
