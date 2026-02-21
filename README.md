# VPS_Coding – Maurice's Web Projects

Monorepo für meine Website `mauricefun.lol` und alle darauf gehosteten Spiele/Projekte.

## Struktur

```
.
├── index.html          # Hauptseite (https://mauricefun.lol)
├── games/              # Hier alle Spiel-Ordner ablegen
│   ├── ski-resort-idle/
│   └── game_bridle/
├── config/
│   └── nginx-site.conf # nginx Konfiguration
└── deploy.sh           # Ein-Klick-Deployment auf den Server
```

## Deployment

Nach jedem `git pull` einfach ausführen:

```bash
./deploy.sh
```

Das Skript:
- updated nginx Konfiguration
- kopiert die Website
- erstellt Symlinks für alle Spiele in `games/`
- reloadet nginx

## Neues Spiel hinzufügen

1. Spiel-Ordner in `games/` ablegen (z.B. `games/mein-neues-spiel/`)
2. `git add games/mein-neues-spiel && git commit -m "Add mein-neues-spiel"`
3. `git push`
4. Auf dem Server: `git pull && ./deploy.sh`

Fertig – das Spiel ist unter `https://mauricefun.lol/mein-neues-spiel/` erreichbar.

## Technik

- Webserver: nginx
- SSL: Let's Encrypt (automatische Erneuerung)
- Hosting: /var/www/mauricefun.lol

---

Built by Schmachti 🤖
