#!/bin/bash
set -e

echo "🚀 Deploying mauricefun.lol..."

# 1. NGINX Config kopieren
sudo cp config/nginx-site.conf /etc/nginx/sites-available/mauricefun.lol
sudo ln -sf /etc/nginx/sites-available/mauricefun.lol /etc/nginx/sites-enabled/mauricefun.lol
sudo rm -f /etc/nginx/sites-enabled/default

# 2. Webroot vorbereiten
sudo mkdir -p /var/www/mauricefun.lol/html
sudo mkdir -p /var/www/mauricefun.lol/html/data

# Sync alle Dateien und Ordner, AUßER config, scripts, games und Git-bezogene Dateien
# rsync eignet sich hierfür am besten
sudo rsync -av --exclude '.git' \
             --exclude '.gitignore' \
             --exclude 'README.md' \
             --exclude 'config' \
             --exclude 'scripts' \
             --exclude 'games' \
             --exclude 'deploy.sh' \
             ./ /var/www/mauricefun.lol/html/

sudo chown -R www-data:www-data /var/www/mauricefun.lol/html

# 3. Games als Symlinks verlinken
for game in games/*; do
    if [ -d "$game" ]; then
        name=$(basename "$game")
        sudo ln -sf "/var/www/games/$name" "/var/www/mauricefun.lol/html/$name"
        echo "🔗 Linked game: $name"
    fi
done

# 4. Nginx testen und reloaden
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Deployment successful!"
echo "🌐 Website: https://mauricefun.lol"
