#!/usr/bin/env python3
"""
Flunkyball API - Einfach, JSON-basiert
"""
import json
import random
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.parse
import os

DATA_FILE = '/home/ubuntu/VPS_Coding_full/14mai/flunkyball_data.json'
ADMIN_PASSWORD = 'edmund'

def load_data():
    if not os.path.exists(DATA_FILE):
        return {"players": [], "games": [], "next_player_id": 1, "next_game_id": 1}
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

class Handler(BaseHTTPRequestHandler):
    def _json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        if path == '/api/players':
            data = load_data()
            self._json_response(data['players'])
        elif path == '/api/games':
            data = load_data()
            self._json_response(data['games'])
        else:
            self.send_error(404)
    
    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        length = int(self.headers['Content-Length'])
        body = self.rfile.read(length)
        req = json.loads(body.decode())
        
        if path == '/api/register':
            self._register(req)
        elif path == '/api/game/create':
            self._create_game(req)
        elif path == '/api/game/winner':
            self._add_winner(req)
        elif path == '/api/admin/login':
            self._admin_login(req)
        else:
            self.send_error(404)
    
    def _register(self, req):
        name = req.get('name', '').strip()
        if not name:
            self._json_response({'error': 'Name required'}, 400)
            return
        
        data = load_data()
        # Check if name exists
        if any(p['name'] == name for p in data['players']):
            self._json_response({'error': 'Name already exists'}, 400)
            return
        
        player = {
            'id': data['next_player_id'],
            'name': name,
            'total_wins': 0
        }
        data['players'].append(player)
        data['next_player_id'] += 1
        save_data(data)
        self._json_response({'success': True, 'player': player})
    
    def _create_game(self, req):
        player_ids = req.get('player_ids', [])
        team_count = req.get('team_count', 2)
        
        if len(player_ids) < 2:
            self._json_response({'error': 'Need at least 2 players'}, 400)
            return
        
        data = load_data()
        # Shuffle and assign teams
        shuffled = player_ids.copy()
        random.shuffle(shuffled)
        teams = [[] for _ in range(team_count)]
        for i, pid in enumerate(shuffled):
            team_num = i % team_count
            teams[team_num].append(pid)
        
        game = {
            'id': data['next_game_id'],
            'created_at': '2026-05-08T18:30:00',  # Simplified
            'status': 'active',
            'teams': teams,
            'winners': []
        }
        data['games'].append(game)
        data['next_game_id'] += 1
        save_data(data)
        self._json_response({'success': True, 'game': game})
    
    def _add_winner(self, req):
        game_id = req.get('game_id')
        player_id = req.get('player_id')
        
        data = load_data()
        # Find game
        game = next((g for g in data['games'] if g['id'] == game_id), None)
        if not game:
            self._json_response({'error': 'Game not found'}, 404)
            return
        
        # Add winner
        if player_id not in game['winners']:
            game['winners'].append(player_id)
        
        # Update player wins
        player = next((p for p in data['players'] if p['id'] == player_id), None)
        if player:
            player['total_wins'] += 1
        
        save_data(data)
        self._json_response({'success': True})
    
    def _admin_login(self, req):
        password = req.get('password', '')
        if password == ADMIN_PASSWORD:
            self._json_response({'success': True})
        else:
            self._json_response({'error': 'Wrong password'}, 401)
    
    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', 8082), Handler)
    print('Flunkyball API on port 8082')
    server.serve_forever()
