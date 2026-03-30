# 🍺 Beer & Cider Style Explorer

An interactive brewing dashboard based on **Brewers Association Beer Style Guidelines 2026** and **World Beer Cup 2026** categories.

## Features

- **Style Explorer** — Browse and filter 19 styles across IPA, Stout, Lager, Mixed Fermentation & Cider
- **Compare Styles** — Side-by-side radar chart comparison of any two styles (ABV, IBU, SRM, OG, attenuation)
- **Recipe Builder** — Generate a grain bill, hop schedule, yeast & water profile for any style + export to Excel
- **Style Drift Analyzer** — Enter your recipe metrics and see which styles you drift toward or away from, with specific adjustment suggestions

## Styles Covered

| Category | Styles |
|---|---|
| IPA | American IPA, Hazy/NEIPA, West Coast IPA, Double IPA, Session IPA |
| Stout | American Stout, Imperial Stout, Oatmeal Stout, Milk/Sweet Stout |
| Lager | German Pilsner, Czech Pilsner, American Lager, Munich Helles, Schwarzbier |
| Mixed Fermentation | American Wild Ale, Gueuze/Lambic, Flanders Red, Berliner Weisse, Saison |
| Cider | Traditional Dry, Sweet, Farmhouse/Heritage, Hopped Cider |

## Hosting via OpenClaw

### Quick start
```bash
chmod +x serve.sh openclaw-service.sh
./openclaw-service.sh start
```

### Service management
```bash
./openclaw-service.sh start    # Start on port 8099
./openclaw-service.sh stop     # Stop the service
./openclaw-service.sh restart  # Restart
./openclaw-service.sh status   # Check status
```

### Custom port
```bash
./serve.sh 9000
```

## File Structure
```
beer-style-explorer/
├── index.html          # Main dashboard
├── style.css           # Dark theme styles
├── data.js             # Style data (BA 2026 + WBC 2026)
├── app.js              # Interactive logic (Chart.js + XLSX)
├── serve.sh            # Simple static server script
├── openclaw-service.sh # OpenClaw bot service manager
└── README.md
```

## Dependencies (CDN — no install needed)
- [Chart.js 4.4](https://www.chartjs.org/) — radar + bar charts
- [SheetJS/xlsx](https://sheetjs.com/) — Excel export
