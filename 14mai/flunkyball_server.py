#!/usr/bin/env python3
"""
Flunkyball API Server
Handles player registration, game creation, team generation, win tracking
"""
import sqlite3
import json
import random
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.parse
import os

DB_PATH = '/home/ubuntu/VPS_Coding_full/14mai/flunkyball.db'
ADMIN_PASSWORD = 'edmund'

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Players table
    c.execute('''CREATE TABLE IF NOT EXISTS players
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT UNIQUE NOT NULL,
                  total_wins INTEGER DEFAULT 0,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Games table
    c.execute('''CREATE TABLE IF NOT EXISTS games
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  status TEXT DEFAULT 'active',
                  team_count INTEGER DEFAULT 2)''')
    
    # Game players table
    c.execute('''CREATE TABLE IF NOT EXISTS game_players
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  game_id INTEGER,
                  player_id INTEGER,
                  team_number INTEGER,
                  FOREIGN KEY (game_id) REFERENCES games(id),
                  FOREIGN KEY (player_id) REFERENCES players(id))''')
    
    # Game winners table
    c.execute('''CREATE TABLE IF NOT EXISTS game_winners
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  game_id INTEGER,
                  player_id INTEGER,
                  FOREIGN KEY (game_id) REFERENCES games(id),
                  FOREIGN KEY (player_id) REFERENCES players(id))''')
    
    conn.commit()
    conn.close()

def get_db():
    return sqlite3.connect(DB_PATH)

class FlunkyballAPI(BaseHTTPRequestHandler):
    
    def _set_headers(self, content_type='application/json'):
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_OPTIONS(self):
        self._set_headers()
    
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/players':
            self.list_players()
        elif path == '/api/games':
            self.list_games('all')
        elif path == '/api/games/active':
            self.list_games('active')
        else:
            self.send_error(404)
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        if self.path == '/api/register':
            self.register_player(data)
        elif self.path == '/api/game/create':
            self.create_game(data)
        elif self.path == '/api/game/winner':
            self.add_winner(data)
        elif self.path == '/api/admin/login':
            self.admin_login(data)
        else:
            self.send_error(404)
    
    def list_players(self):
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT id, name, total_wins FROM players ORDER BY name')
        players = [{'id': row[0], 'name': row[1], 'total_wins': row[2]} 
                   for row in c.fetchall()]
        conn.close()
        
        self._set_headers()
        self.wfile.write(json.dumps(players).encode())
    
    def register_player(self, data):
        name = data.get('name', '').strip()
        if not name:
            self._set_headers()
            self.wfile.write(json.dumps({'error': 'Name required'}).encode())
            return
        
        conn = get_db()
        c = conn.cursor()
        try:
            c.execute('INSERT INTO players (name) VALUES (?)', (name,))
            conn.commit()
            player_id = c.lastrowid
            response = {'success': True, 'id': player_id, 'name': name}
        except sqlite3.IntegrityError:
            response = {'error': 'Name already exists'}
        conn.close()
        
        self._set_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def create_game(self, data):
        player_ids = data.get('player_ids', [])
        team_count = data.get('team_count', 2)
        
        if len(player_ids) < 2:
            self._set_headers()
            self.wfile.write(json.dumps({'error': 'Need at least 2 players'}).encode())
            return
        
        conn = get_db()
        c = conn.cursor()
        
        c.execute('INSERT INTO games (team_count) VALUES (?)', (team_count,))
        game_id = c.lastrowid
        
        # Randomly assign teams
        shuffled = player_ids.copy()
        random.shuffle(shuffled)
        
        teams = [[] for _ in range(team_count)]
        for i, player_id in enumerate(shuffled):
            team_num = i % team_count
            teams[team_num].append(player_id)
            c.execute('INSERT INTO game_players (game_id, player_id, team_number) VALUES (?, ?, ?)',
                     (game_id, player_id, team_num))
        
        conn.commit()
        conn.close()
        
        self._set_headers()
        self.wfile.write(json.dumps({
            'success': True,
            'game_id': game_id,
            'teams': teams
        }).encode())
    
    def list_games(self, status):
        conn = get_db()
        c = conn.cursor()
        
        if status == 'active':
            c.execute('SELECT id, created_at, status FROM games WHERE status = "active" ORDER BY created_at DESC')
        else:
            c.execute('SELECT id, created_at, status FROM games ORDER BY created_at DESC')
        
        games = []
        for row in c.fetchall():
            game_id = row[0]
            c.execute('''SELECT p.id, p.name, gp.team_number 
                        FROM game_players gp 
                        JOIN players p ON gp.player_id = p.id 
                        WHERE gp.game_id = ?''', (game_id,))
            players = [{'id': p[0], 'name': p[1], 'team': p[2]} for p in c.fetchall()]
            
            c.execute('''SELECT p.id, p.name 
                        FROM game_winners gw 
                        JOIN players p ON gw.player_id = p.id 
                        WHERE gw.game_id = ?''', (game_id,))
            winners = [{'id': w[0], 'name': w[1]} for w in c.fetchall()]
            
            games.append({
                'id': row[0],
                'created_at': row[1],
                'status': row[2],
                'players': players,
                'winners': winners
            })
        
        conn.close()
        
        self._set_headers()
        self.wfile.write(json.dumps(games).encode())
    
    def add_winner(self, data):
        game_id = data.get('game_id')
        player_id = data.get('player_id')
        
        conn = get_db()
        c = conn.cursor()
        
        c.execute('INSERT INTO game_winners (game_id, player_id) VALUES (?, ?)',
                 (game_id, player_id))
        c.execute('UPDATE players SET total_wins = total_wins + 1 WHERE id = ?',
                 (player_id,))
        c.execute('UPDATE games SET status = "completed" WHERE id = ? AND status = "active"',
                 (game_id,))
        
        conn.commit()
        conn.close()
        
        self._set_headers()
        self.wfile.write(json.dumps({'success': True}).encode())
    
    def admin_login(self, data):
        password = data.get('password', '')
        if password == ADMIN_PASSWORD:
            self._set_headers()
            self.wfile.write(json.dumps({'success': True}).encode())
        else:
            self._set_headers()
            self.wfile.write(json.dumps({'error': 'Wrong password'}).encode())
    
    def log_message(self, format, *args):
        pass

def run_server():
    init_db()
    server = HTTPServer(('127.0.0.1', 8082), FlunkyballAPI)
    print('Flunkyball API running on port 8082...')
    server.serve_forever()

if __name__ == '__main__':
    run_server()
