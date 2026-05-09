# MLB Favorite Player Hub

A MERN stack portfolio app for searching MLB players, viewing player details, saving favorite players, and receiving simple rule-based recommendations.

## Live Demo

- Frontend: https://mlb-app-eight.vercel.app
- Backend API: https://mlb-app-wzpt.onrender.com

## Overview

This app uses the MLB Stats API as the main player data source and MongoDB as the user data store.

Users can register, login, search MLB players, view detailed player information, save favorite players, edit notes and favorite reasons, complete onboarding, and see personalized recommendations on the Home page.

The recommendation feature is currently rule-based in Express. It is intentionally separated into a service layer so it can later be replaced by a FastAPI recommendation service.

## Core Features

- User registration and login with JWT authentication
- Search MLB players through the external MLB Stats API
- View player detail pages with current season stats, recent games, career stats, and Baseball Savant links
- Save favorite players to MongoDB
- Edit favorite notes, favorite reasons, and tags
- Delete favorite players
- Onboarding flow for new users
- Favorite team selection from all 30 MLB teams
- Select at least 3 favorite players during onboarding
- Personalized Home page based on favorite team and saved favorites
- Rule-based recommendations from favorite team, current stats, saved players, and fallback stars
- Deployed frontend, backend, and database using Vercel, Render, and MongoDB Atlas

## Main User Flow

```txt
Register / Login
  -> Onboarding Team
  -> Onboarding Favorites
  -> Home
  -> Search
  -> Player Detail
  -> Add to Favorites
  -> Favorites
```

## Screenshots

Screenshots will be added after final UI adjustments.

Suggested screenshots:

```txt
docs/screenshots/home.png
docs/screenshots/search.png
docs/screenshots/player-detail.png
docs/screenshots/favorites.png
docs/screenshots/onboarding.png
```

## Tech Stack

- Frontend: React, Vite, React Router
- Backend: Node.js, Express
- Database: MongoDB Atlas, Mongoose
- Authentication: JWT, bcryptjs
- External API: MLB Stats API
- Styling: CSS, Tailwind CSS utilities, Catppuccin Mocha, Maple Mono NF
- Deployment: Vercel, Render, MongoDB Atlas
- Local tools: Docker Compose for local MongoDB testing

## Project Structure

```txt
mlb-app
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   └── server.js
├── frontend
│   └── src
│       ├── components
│       ├── pages
│       ├── services
│       │   └── api
│       ├── utils
│       └── App.jsx
└── docker-compose.yml
```

## Local Setup

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

## Demo Account

For local testing, you can create an account from the Register page.

If you prepare a demo account for reviewers, use this format in your portfolio submission:

```txt
Email: demo@example.com
Password: demo-password
```

Do not commit real passwords or private credentials to the repository.

## API Overview

Auth:

```txt
POST /api/auth/register
POST /api/auth/login
```

Users:

```txt
GET /api/users/me
PATCH /api/users/me/favorite-team
PATCH /api/users/me/onboarding-complete
```

External MLB players:

```txt
GET /api/external/players/search?q=shohei%20ohtani
GET /api/external/players/:playerId
GET /api/external/players/team/:teamId
GET /api/external/players/team/:teamId/recommended
```

Favorites:

```txt
GET /api/favorites
POST /api/favorites
POST /api/favorites/bulk
PUT /api/favorites/:id
DELETE /api/favorites/:id
```

Recommendations:

```txt
GET /api/recommendations
```

## Security Notes

- JWT is issued on login and stored in localStorage on the frontend.
- Protected API requests send the token with the `Authorization` header.
- Backend protected routes use auth middleware to verify the JWT.
- Passwords are hashed with bcryptjs before storing in MongoDB.
- `.env` files are ignored and should not be committed.
- CORS is limited by `FRONTEND_URL` and local development origins.
- MongoDB Atlas credentials and JWT secrets must be managed through environment variables.

Example protected request:

```txt
Authorization: Bearer <token>
```

## Design Notes

- Player data comes from the MLB Stats API.
- User-specific data is stored in MongoDB.
- Favorites are scoped to the logged-in user.
- Onboarding stores a favorite team and creates initial favorite players.
- Recommendation logic is separated into `recommendationService.js`.
- The current recommendation logic is rule-based and can later be replaced by FastAPI.
- API calls on the frontend are separated under `frontend/src/services/api`.

## Recommendation Rules

The current recommendation logic prioritizes:

- Active roster players
- Players with current season stats
- Favorite team players
- A balance of hitters and pitchers
- Popular star players
- Fallback players if external API data is not enough

## Known Limitations

- Automated tests are not yet implemented.
- Screenshots are not yet added.
- Recommendation is rule-based, not machine learning-based.
- The legacy `/players` manual data page still exists for learning history and admin-style testing.
- Some MLB API fields may be missing depending on the player or season.

## Future Improvements

- Add screenshots to README
- Add automated tests for backend APIs
- Add frontend smoke tests for main flows
- Add role-based authorization
- Add profile/settings page for changing favorite team
- Move recommendation logic to FastAPI
- Improve mobile UI polish
- Add loading skeletons and more detailed error states
