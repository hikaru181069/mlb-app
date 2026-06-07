# MLB Player Scout

A full-stack MLB player analysis app built with MERN + FastAPI. The flagship feature is a **Player Scouting Report** that dynamically compares any MLB player's stats against the current season's top 200 players using percentile calculation and cosine similarity.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white)

## Live Demo

- Frontend: https://mlb-app-eight.vercel.app
- Backend API: https://mlb-app-wzpt.onrender.com

No API key or setup is required. Register directly from the app.

## Why I Built This

I built this app to learn full-stack MERN development end-to-end, from Express routing and JWT auth through MongoDB data modeling to React component design and deployment. The Player Scouting Report was added to differentiate the app from a standard MERN tutorial — it introduces a Python microservice (FastAPI) for analytics and applies cosine similarity to find comparable players, making the architecture closer to a real production system.

## Flagship Feature: Player Scouting Report

Search any active MLB player and instantly generate a scouting report comparing their stats against the current season's top 200 hitters or pitchers.

**How it works:**

```
User searches a player
  ↓
Express fetches player stats from MLB Stats API
Express fetches league top-200 distributions (cached 24h)
  ↓
Both are sent to FastAPI as a POST request
  ↓
FastAPI calculates percentile rank for each stat
FastAPI runs cosine similarity to find comparable players
FastAPI classifies player type (Power Hitter, Ace, etc.)
  ↓
React renders SVG radar chart + animated percentile bars
```

**Hitter metrics:** OPS · Home Runs · Stolen Bases · Batting Average · RBI

**Pitcher metrics:** ERA · WHIP · Strikeouts · Wins · Innings Pitched

The league distributions are fetched live from the MLB Stats API on first request and cached in Express memory for 24 hours — no hardcoded averages.

## Core Features

- User registration and login with JWT authentication
- Search any MLB player through the MLB Stats API
- Player detail pages: current season stats, career stats, game highlights, play-by-play, injury status
- Save favorite players to MongoDB with notes, reasons, and tags
- Onboarding flow: choose a favorite team, select 3+ favorite players
- Personalized Home page with Future Stars recommendations
- **Player Scouting Report** — percentile analysis, SVG radar chart, player type classification, comparable players
- Deployed frontend, backend, and database on Vercel, Render, and MongoDB Atlas

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router 7 |
| Backend | Node.js 18+, Express 5 |
| Analytics service | Python 3.11+, FastAPI, NumPy |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcryptjs |
| External data | MLB Stats API (no key required) |
| Styling | Custom CSS (Catppuccin dark theme) |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas |

## Architecture

```
React (Vite)
  ↓  REST API
Express (Node.js)                    FastAPI (Python)
  ├─ routes / controllers            ├─ /scouting-report
  ├─ services/mlbApiService          │    percentile calculation
  ├─ services/leagueStatsService     │    cosine similarity
  └─ services/fastApiService  ──────→└─ /similar-players
         ↓
     MongoDB Atlas
    (user data only)
         ↓
     MLB Stats API
    (player data, live)
```

Player data flows through the Express backend as a proxy. MongoDB only stores user data (User, FavoritePlayer). The FastAPI service handles all compute-heavy analytics.

## Project Structure

```
mlb-app/
├── backend/
│   ├── config/             # MongoDB connection
│   ├── controllers/        # Request/response handlers
│   │   └── scoutController.js   # Scouting report orchestration
│   ├── middleware/          # JWT auth middleware (protect)
│   ├── models/             # Mongoose schemas (User, FavoritePlayer)
│   ├── routes/             # Express route definitions
│   ├── services/
│   │   ├── mlb/
│   │   │   └── leagueStatsService.js  # Top-200 distributions, 24h cache
│   │   ├── fastApiService.js          # FastAPI client
│   │   └── recommendations/           # Future Stars logic
│   └── server.js
├── fastapi-service/
│   └── main.py             # Percentile calc, cosine similarity, player typing
├── frontend/
│   └── src/
│       ├── components/     # Shared UI components
│       ├── pages/
│       │   └── ScoutPage.jsx    # Radar chart, percentile bars, search
│       ├── services/api/   # One file per backend resource
│       └── App.jsx
└── docker-compose.yml      # Local MongoDB
```

## Local Setup

**Requirements:** Node.js 18+, Python 3.11+, Docker

### 1. Clone and install

```bash
git clone https://github.com/your-username/mlb-app.git
cd mlb-app

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# FastAPI (create venv at repo root)
cd ..
python3 -m venv .venv
.venv/bin/pip install fastapi uvicorn numpy pydantic
```

### 2. Environment variables

`backend/.env`:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

`frontend/.env`:
```env
VITE_API_URL=http://localhost:5001
```

### 3. Start all services

```bash
# MongoDB (local)
docker compose up -d

# FastAPI analytics service (port 8000)
cd fastapi-service
/path/to/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Express backend (port 5001)
cd backend
npm run dev

# React frontend (port 5173)
cd frontend
npm run dev
```

Open `http://localhost:5173`

The Scouting Report requires FastAPI to be running. If FastAPI is offline, raw stats are shown as a fallback.

## API Overview

`🔒` = requires `Authorization: Bearer <token>`

**Auth**
```
POST /api/auth/register
POST /api/auth/login
```

**Users** 🔒
```
GET    /api/users/me
PATCH  /api/users/me/favorite-team
PATCH  /api/users/me/onboarding-complete
```

**MLB Players (proxied from MLB Stats API)**
```
GET /api/external/players/search?q=ohtani
GET /api/external/players/:playerId
GET /api/external/players/team/:teamId
```

**Scouting Report (public)**
```
GET /api/scout/:playerId
```

**Favorites** 🔒
```
GET    /api/favorites
POST   /api/favorites
PUT    /api/favorites/:id
DELETE /api/favorites/:id
```

**Recommendations** 🔒
```
GET /api/recommendations
```

## Scouting Report: Technical Notes

**Percentile calculation**

For each stat, the player's value is ranked against the top-200 distribution fetched from the MLB Stats API leaderboard:

```python
def calc_percentile(value, distribution, higher_is_better=True):
    if not distribution:
        return 50  # fallback when data unavailable
    if higher_is_better:
        return round(sum(v < value for v in distribution) / len(distribution) * 100)
    else:
        return round(sum(v > value for v in distribution) / len(distribution) * 100)
```

ERA, WHIP, and walks use `higher_is_better=False` (lower is better for pitchers).

**Cosine similarity**

Player stats are normalized into vectors and compared using cosine similarity to find comparable players:

```python
def cosine_similarity(a, b):
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    return dot / norm if norm > 0 else 0.0
```

For pitchers, ERA/WHIP/walks are inverted before vectorization so that similar pitchers (e.g., two low-ERA starters) cluster together.

**SVG Radar Chart**

The radar chart is built with pure SVG — no chart library — using polar coordinate math:

```js
// Each axis placed evenly around a circle, starting from the top
const angle = (2 * Math.PI * i) / n - Math.PI / 2;
const x = cx + radius * Math.cos(angle);
const y = cy + radius * Math.sin(angle);
```

## Security Notes

- JWT stored in `localStorage`; sent via `Authorization: Bearer <token>`
- Protected routes verify JWT in middleware before any controller logic
- Passwords hashed with bcryptjs
- CORS restricted to `FRONTEND_URL` and local development origins
- `.env` files are gitignored

## Known Limitations

- No automated tests. Use `backend/test.http` for manual API testing.
- FastAPI runs in-process; league stats cache resets on restart.
- Player type classification is rule-based (percentile thresholds), not a trained ML model.
- The legacy `/players` page remains as a learning artifact.

## License

MIT
