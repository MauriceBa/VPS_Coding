# systemd units

Reference unit files for running the mauricefun backend on the VPS. They assume the
repository is checked out at `/home/ubuntu/VPS_Coding_full`, a virtualenv at
`.venv/`, and secrets configured in `.env` (see [`.env.example`](../.env.example)).

## Install

```bash
sudo cp systemd/*.service systemd/*.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mauricefun-monitoring mauricefun-results \
  mauricefun-remontees-api mauricefun-untappd-api mauricefun-balloons
sudo systemctl enable --now mauricefun-stats.timer mauricefun-solar.timer
```

## Units

| Unit | Purpose |
|------|---------|
| `mauricefun-monitoring.service` | Combined static + `/api/stats` server (port 8080) |
| `mauricefun-results.service` | Results static server (port 8082) |
| `mauricefun-remontees-api.service` | FastAPI scraper wrapper (port 8000) |
| `mauricefun-untappd-api.service` | Untappd scraper trigger API (port 5000) |
| `mauricefun-balloons.service` | Telegram balloon tracker |
| `mauricefun-stats.service` / `.timer` | Host-stats cron job |
| `mauricefun-solar.service` / `.timer` | FoxESS solar data fetch |

Logs: `journalctl -u mauricefun-monitoring -f`.
