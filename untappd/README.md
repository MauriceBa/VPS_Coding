# Untappd Stats – Maurice

Personal Untappd statistics & data for the beer stats website.

## Overview
| Metric | Value |
|--------|-------|
| Total Check-ins | 738 |
| Unique Beers | 658 |
| Unique Breweries | 307 |
| Unique Venues | 71 |
| Friends Tagged | 6 |
| Badge Types | 144 |
| Date Range | 2025-07-12 → 2026-02-21 |

## Folder Structure

```
untappd/
├── README.md
├── data/
│   ├── untappd_data.json       ← Main data file for website frontend
│   ├── untappd_maurice.db      ← SQLite database (7 tables, 11 views)
│   └── csv/
│       ├── checkins_full.csv   ← All 738 check-ins with full details
│       ├── top_beers.csv
│       ├── top_breweries.csv
│       ├── top_venues.csv
│       ├── monthly_activity.csv
│       ├── weekday_activity.csv
│       ├── style_counts.csv
│       ├── friend_tags.csv
│       ├── heatmap_data.csv
│       └── badge_progress.csv
└── scripts/
    └── parse_untappd.py        ← Script to regenerate DB from raw export
```

## Database Schema

**Tables:** `checkins`, `beers`, `breweries`, `venues`, `friends`, `checkin_friends`, `checkin_badges`

**Useful Views:**
- `v_checkins` – Full join of all tables (beer, brewery, venue, GPS, weekday)
- `v_top_beers`, `v_top_breweries`, `v_top_venues` – Rankings
- `v_monthly_activity`, `v_weekday_activity` – Time-based stats
- `v_style_counts` – Beer type distribution
- `v_heatmap` – Venues with coordinates + visit counts
- `v_friend_tags` – Friends ranking
- `v_badge_progress` – Max badge level per badge type

## Website Features (planned)
- 📊 Statistics page: beer styles, serving types, monthly/weekday activity
- 🗺️ Heatmap: where Maurice drinks most (Leaflet.js + leaflet.heat)
- 👥 Friends page: tagged friends with session counts
- 🏆 Badges page: all earned badges with progress levels
- 🍺 Beer explorer: searchable list of all 658 beers

## Notes on Venue Geocoding
- `Untappd at Home` → Aachen (50.7753, 6.0839)
- Venues without a recognized name have `lat/lon = NULL`
- Valmeinier ski trip (Feb 7–14, 2026) and Châtel ski trip (Dec 2025) are mapped
