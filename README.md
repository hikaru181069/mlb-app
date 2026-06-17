# MLB Player Discovery Platform

A full-stack MLB player discovery app built with MERN + FastAPI. Find players with a similar playstyle to your favorites — powered by cosine similarity on weighted percentile vectors.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white)

## Live Demo

- Frontend: https://mlb-app-eight.vercel.app
- Backend API: https://mlb-app-wzpt.onrender.com

No API key or setup required. Register directly from the app.

## Why I Built This

I built this app to learn full-stack development end-to-end: Express routing and JWT auth, MongoDB data modeling, React component design, FastAPI microservice, and deployment. The player similarity engine was added to go beyond a MERN tutorial — it introduces real analytics (cosine similarity, percentile normalization, OAA defensive metrics) and a multi-service architecture.

## Core Features

- User registration and login with JWT authentication
- Onboarding: pick 3+ favorite players from league leaders — no team selection required
- Personalized recommendations: each favorite player seeds 2 similar players via FastAPI
- **Player Scouting Report** — percentile bars, SVG radar chart, player type classification, comparable players
- Search any MLB player through the MLB Stats API
- Player detail pages: current stats, career stats, year-by-year, game highlights, play-by-play, injury list
- Save favorite players with notes, reasons, and tags
- League standings, news, team rosters
- Mobile-first layout with bottom tab bar

## How Recommendations Work

```
User's favorite players (up to 3)
  ↓
For each favorite: fetch live stats from MLB Stats API + OAA from CSV
  ↓
POST /discover/similar to FastAPI with:
  - target: favorite player's weighted percentile vector
  - candidates: top-200 league players
  ↓
FastAPI ranks candidates by blended score:
  stat_similarity (85%) + position_similarity (15%)
  ↓
Top 2 similar players per favorite → deduplicated → shown with reason
"Similar playstyle to [FavoriteName]"
```

**Hitter weights:** OPS×2.0 · HR×1.5 · OAA×1.3 · SB×1.1 · AVG×1.0 · RBI×0.8

OAA (Outs Above Average) is loaded from a manually updated Baseball Savant CSV at server startup.

## Player Scouting Report

Search any active MLB player and instantly generate a scouting report.

```
User searches a player
  ↓
Express fetches player stats from MLB Stats API
Express fetches league top-200 distributions (cached 24h)
  ↓
Both sent to FastAPI POST /scouting-report
  ↓
FastAPI calculates percentile rank for each stat
FastAPI runs cosine similarity → comparable players
FastAPI classifies player archetype (Power Hitter, Ace, etc.)
  ↓
React renders SVG radar chart + animated percentile bars
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router 7 |
| Backend | Node.js 18+, Express 5 |
| Analytics service | Python 3.11+, FastAPI, NumPy |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcryptjs |
| External data | MLB Stats API (no key required) |
| Defensive metrics | Baseball Savant OAA CSV (manual update) |
| Styling | Custom CSS (Catppuccin dark theme) |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas |

## Architecture

```
React (Vite)
  ↓  REST API
Express (Node.js)                    FastAPI (Python)
  ├─ routes / controllers            ├─ /scouting-report
  ├─ services/mlb/                   │    percentile calc + cosine similarity
  │   ├─ leagueStatsService          ├─ /discover/similar
  │   ├─ baseballSavantService       │    weighted vector matching
  │   └─ playerStatsService          ├─ /similar
  ├─ services/recommendations/  ────→├─ /recommend/future-stars
  └─ services/fastApiService         ├─ /archetype/classify
         ↓                           ├─ /compare/analyze
     MongoDB Atlas                   └─ /matchup/predict
    (user data only)
         ↓
     MLB Stats API
    (player data, live)
```

## Project Structure

```
mlb-app/
├── backend/
│   ├── controllers/        # Request handlers
│   ├── middleware/          # JWT auth (protect)
│   ├── models/             # Mongoose schemas (User, FavoritePlayer)
│   ├── routes/             # Express route definitions
│   ├── data/
│   │   └── oaa_2026.csv    # Baseball Savant OAA data (manual update)
│   └── services/
│       ├── mlb/
│       │   ├── leagueStatsService.js   # Top-200 distributions, 24h cache
│       │   ├── baseballSavantService.js # OAA CSV loader (in-memory cache)
│       │   └── playerStatsService.js
│       ├── recommendations/             # Discovery-based recommendation engine
│       └── fastApiService.js            # FastAPI client
├── fastapi-service/
│   ├── main.py             # App entry point, CORS, router registration
│   ├── core/
│   │   └── math_utils.py   # Percentile calc, cosine similarity, position scoring
│   └── routers/
│       ├── discover.py     # /discover/similar — weighted playstyle matching
│       ├── scouting.py     # /scouting-report
│       ├── similar.py      # /similar
│       ├── recommend.py    # /recommend/future-stars
│       ├── archetype.py    # /archetype/classify
│       ├── compare.py      # /compare/analyze
│       └── matchup.py      # /matchup/predict
├── frontend/
│   └── src/
│       ├── components/     # Shared UI components
│       ├── pages/          # One file per route
│       └── services/api/   # One file per backend resource
└── docker-compose.yml      # Local MongoDB
```

## Local Setup

**Requirements:** Node.js 18+, Python 3.11+, Docker

### 1. Clone and install

```bash
git clone https://github.com/your-username/mlb-app.git
cd mlb-app

cd backend && npm install
cd ../frontend && npm install

# FastAPI venv at repo root
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
# MongoDB
docker compose up -d

# FastAPI (port 8000)
cd fastapi-service
/path/to/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Express backend (port 5001)
cd backend && npm run dev

# React frontend (port 5173)
cd frontend && npm run dev
```

Open `http://localhost:5173`

The Scouting Report and recommendations require FastAPI. If FastAPI is offline, fallback responses are returned automatically.

## API Overview

`🔒` = requires `Authorization: Bearer <token>`

**Auth**
```
POST /api/auth/register
POST /api/auth/login
```

**Users** 🔒
```
GET   /api/users/me
PATCH /api/users/me/onboarding-complete
```

**MLB Players**
```
GET /api/external/players/search?q=ohtani
GET /api/external/players/popular          # onboarding: league leaders
GET /api/external/players/suggestions?q=   # typeahead
GET /api/external/players/:playerId
GET /api/external/players/:playerId/year-by-year
GET /api/external/players/team/:teamId
```

**Scouting Report**
```
GET /api/scout/:playerId
```

**Favorites** 🔒
```
GET    /api/favorites
POST   /api/favorites
POST   /api/favorites/bulk
PUT    /api/favorites/:id
DELETE /api/favorites/:id
```

**Recommendations** 🔒
```
GET /api/recommendations
```

## Technical Notes

**Percentile normalization**

Each stat is converted to a percentile rank within the current candidate pool (0–1), making comparisons season-agnostic:

```python
def calc_percentile(value, distribution, higher_is_better=True):
    if not distribution:
        return 50
    if higher_is_better:
        return round(sum(v < value for v in distribution) / len(distribution) * 100)
    else:
        return round(sum(v > value for v in distribution) / len(distribution) * 100)
```

**Weighted cosine similarity**

Percentile vectors are multiplied by a weight array before similarity is computed — higher-weight dimensions pull the score more strongly:

```python
HITTER_WEIGHTS = np.array([2.0, 1.5, 1.1, 1.0, 0.8, 1.3])
# Order: [OPS, HR, SB, AVG, RBI, OAA]

def hitter_percentile_vector(player, pct_funcs):
    raw = np.array([pct_funcs["ops"](player.ops), ...])
    return raw * HITTER_WEIGHTS
```

**Position-aware scoring**

Similarity blends stat similarity with position compatibility:

```python
final_score = 0.85 * stat_similarity + 0.15 * position_score(pos1, pos2)
# position_score: same position=1.0, same group (e.g. SS/2B)=0.5, different=0.0
```

**OAA (Outs Above Average)**

Defensive metric from Baseball Savant, loaded once at server startup from `backend/data/oaa_2026.csv`. The CSV is updated manually each season.

**SVG Radar Chart**

Built with pure SVG — no chart library:

```js
const angle = (2 * Math.PI * i) / n - Math.PI / 2;
const x = cx + radius * Math.cos(angle);
const y = cy + radius * Math.sin(angle);
```

## Security

- JWT stored in `localStorage`, sent via `Authorization: Bearer <token>`
- Protected routes verify JWT before any controller logic
- Passwords hashed with bcryptjs
- CORS restricted to `FRONTEND_URL` and local origins
- `.env` gitignored

## Known Limitations

- No automated tests. Use `backend/test.http` for manual API testing.
- OAA CSV must be updated manually each season from Baseball Savant.
- FastAPI league stats cache resets on process restart.
- Player type classification is rule-based (percentile thresholds), not a trained ML model.

## License

MIT
