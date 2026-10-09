#!/usr/bin/env bash
#
# One-shot deployment for mauricefun.lol.
#
# Syncs the static site to the nginx webroot, links the browser games and reloads
# nginx. The Python backend is *not* copied to the webroot: it runs from the repo
# checkout (see systemd/ for the service units).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBROOT="/var/www/mauricefun.lol/html"
GAMES_ROOT="/var/www/games"

echo "🚀 Deploying mauricefun.lol..."

# 1. nginx configuration
sudo cp "${REPO_DIR}/config/nginx-site.conf" /etc/nginx/sites-available/mauricefun.lol
sudo ln -sf /etc/nginx/sites-available/mauricefun.lol /etc/nginx/sites-enabled/mauricefun.lol
sudo rm -f /etc/nginx/sites-enabled/default

# 2. Webroot
sudo mkdir -p "${WEBROOT}/data"

# 3. Sync the static site (exclude backend, tooling and VCS metadata)
sudo rsync -av \
  --exclude '.git' \
  --exclude '.gitignore' \
  --exclude '.github' \
  --exclude '.venv' \
  --exclude 'node_modules' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude 'src' \
  --exclude 'tests' \
  --exclude 'tasks' \
  --exclude 'systemd' \
  --exclude 'scripts' \
  --exclude 'config' \
  --exclude 'games' \
  --exclude 'untappd/data' \
  --exclude 'README.md' \
  --exclude 'CONTRIBUTING.md' \
  --exclude 'SECURITY.md' \
  --exclude 'deploy.sh' \
  --exclude 'pyproject.toml' \
  --exclude 'requirements*.txt' \
  --exclude 'package*.json' \
  --exclude 'eslint.config.js' \
  --exclude 'vitest.config.js' \
  --exclude '.prettierrc.json' \
  --exclude '.prettierignore' \
  --exclude '.editorconfig' \
  "${REPO_DIR}/" "${WEBROOT}/"

sudo chown -R www-data:www-data "${WEBROOT}"

# 4. Games: sync and link into the webroot
echo "🎮 Syncing games to ${GAMES_ROOT}..."
sudo mkdir -p "${GAMES_ROOT}"
sudo rsync -av --exclude '.git' --exclude '__pycache__' --exclude '*.pyc' \
  "${REPO_DIR}/games/" "${GAMES_ROOT}/"

for game in "${REPO_DIR}"/games/*; do
  if [ -d "$game" ]; then
    name="$(basename "$game")"
    sudo ln -sf "${GAMES_ROOT}/${name}" "${WEBROOT}/${name}"
    echo "🔗 Linked game: ${name}"
  fi
done

# 5. Reload nginx
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Deployment successful!"
echo "🌐 Website: https://mauricefun.lol"
