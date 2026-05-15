# MLB Favorite Player Hub

A MERN stack portfolio app for searching MLB players, viewing player details, saving favorite players, and receiving personalized recommendations.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)

## Live Demo

- Frontend: https://mlb-app-eight.vercel.app
- Backend API: https://mlb-app-wzpt.onrender.com

You can register a new account directly from the app. No API key or setup is required to use the live demo.

## Why I Built This

I built this app to learn full-stack MERN development end-to-end — from Express routing and JWT auth through MongoDB data modeling to React component design and deployment. MLB player data provided a real external API to integrate against, making the project feel practical rather than just a tutorial exercise.

## Overview

This app uses the MLB Stats API as the primary player data source and MongoDB Atlas as the user data store. Player data is never stored in MongoDB unless a user explicitly favorites a player, keeping the data model simple and the MLB API as the source of truth.

Users can register, log in, search MLB players, view detailed player stats, save favorites with notes and tags, complete onboarding, and see personalized recommendations on the Home page.

The recommendation feature is rule-based in Express, intentionally separated into a service layer so it can later be replaced by a FastAPI ML service without touching the rest of the backend.

## Core Features

- User registration and login with JWT authentication
- Search MLB players through the external MLB Stats API
- View player detail pages with current season stats, recent games, career stats, and Baseball Savant links
- Save favorite players to MongoDB with notes, reasons, and tags
- Edit and delete saved favorites
- Onboarding flow: choose a favorite team and select at least 3 favorite players
- Favorite team selection from all 30 MLB teams
- Personalized Home page based on favorite team and saved favorites
- Rule-based recommendations using team roster, current stats, and fallback stars
- Deployed frontend, backend, and database using Vercel, Render, and MongoDB Atlas

## Main User Flow

```txt
Register / Login
  -> Onboarding: Choose Team
  -> Onboarding: Choose Favorites
  -> Home (personalized recommendations)
  -> Search
  -> Player Detail
  -> Add to Favorites
  -> Favorites
```

## Screenshots

_Screenshots will be added after final UI polish._

## Tech Stack

**Core:**

- Frontend: React 19, Vite, React Router 7
- Backend: Node.js 18+, Express 5
- Database: MongoDB Atlas, Mongoose
- Authentication: JWT, bcryptjs
- External API: MLB Stats API (no API key required)

**Styling:**

- Tailwind CSS v4
- Custom CSS

**Deployment:**

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Local dev database: Docker Compose (MongoDB 8.0)

## Architecture

```txt
HTTP Request
  ↓
server.js        (Express setup, CORS)
  ↓
middleware/      (JWT auth: protect())
  ↓
routes/          (URL mapping)
  ↓
controllers/     (request/response handling)
  ↓
services/        (MLB API calls, recommendation logic)
  ↓
models/          (Mongoose schemas)
  ↓
MongoDB Atlas    (user data only)
```

MLB player data flows through `services/mlbApiService.js` and is never stored in MongoDB unless a user explicitly favorites a player.

## Project Structure

```txt
mlb-app/
├── backend/
│   ├── config/         # MongoDB connection
│   ├── controllers/    # Request/response handlers
│   ├── middleware/     # JWT auth middleware (protect)
│   ├── models/         # Mongoose schemas (User, FavoritePlayer)
│   ├── routes/         # Express route definitions
│   ├── services/       # MLB API calls and recommendation logic
│   └── server.js       # Express app entry point
├── frontend/
│   └── src/
│       ├── components/ # Shared UI components
│       ├── pages/      # Route-level page components
│       ├── services/
│       │   └── api/    # One file per backend resource (authApi, favoriteApi, etc.)
│       ├── utils/      # Auth storage helpers, API config
│       └── App.jsx     # Route definitions
└── docker-compose.yml  # Local MongoDB container
```

## Local Setup

**Requirements:** Node.js 18+, Docker (for local MongoDB)

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Create `backend/.env`:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5001
```

Start local MongoDB (optional — or use MongoDB Atlas):

```bash
docker compose up -d
```

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Open:

```txt
http://localhost:5173
```

MLB Stats API requires no API key. All player data is fetched at runtime through the backend proxy.

## API Overview

`🔒` = requires `Authorization: Bearer <token>` header

**Auth:**

```txt
POST /api/auth/register
POST /api/auth/login
```

**Users:** 🔒

```txt
GET    /api/users/me
PATCH  /api/users/me/favorite-team
PATCH  /api/users/me/onboarding-complete
```

**MLB Players (proxied from MLB Stats API):**

```txt
GET /api/external/players/search?q=shohei%20ohtani
GET /api/external/players/:playerId
GET /api/external/players/team/:teamId
GET /api/external/players/team/:teamId/recommended
```

**Favorites:** 🔒

```txt
GET    /api/favorites
POST   /api/favorites
POST   /api/favorites/bulk
PUT    /api/favorites/:id
DELETE /api/favorites/:id
```

**Recommendations:** 🔒

```txt
GET /api/recommendations
```

## Security Notes

- JWT is issued on login and stored in `localStorage` on the frontend.
- Protected API requests send the token via the `Authorization: Bearer <token>` header.
- Backend protected routes verify the JWT using auth middleware.
- Passwords are hashed with bcryptjs before storing in MongoDB.
- `.env` files are gitignored and must never be committed.
- CORS is restricted to `FRONTEND_URL` and local development origins.

## Recommendation Logic

The recommendation engine (`services/recommendationService.js`) prioritizes:

1. Active roster players from the user's favorite team
2. Players with current season stats
3. Balance of hitters and pitchers
4. Popular star players as fallback

This logic is isolated in a service layer so it can be replaced by a FastAPI ML service in the future without changing routes or controllers.

## Known Limitations

- Automated tests are not yet implemented. Use `backend/test.http` for manual API testing.
- Recommendation is rule-based, not ML-based.
- The legacy `/players` page still exists as a learning artifact (manual player data, not part of the main user flow).
- Some MLB Stats API fields may be missing depending on the player or season.

## Future Improvements

- Add screenshots to README
- Add automated tests for backend APIs and frontend flows
- Add role-based authorization
- Add profile/settings page for changing favorite team
- Move recommendation logic to FastAPI
- Improve mobile UI polish
- Add loading skeletons and detailed error states

## License

MIT
