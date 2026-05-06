# MLB Player Search App

A MERN stack portfolio app for searching and managing MLB player data.

## Live Demo

- Frontend: https://mlb-app-eight.vercel.app
- Backend API: https://mlb-app-wzpt.onrender.com

## Overview

This app allows users to search, filter, sort, create, update, and delete MLB player data.
It uses local MongoDB data instead of an external API.

The app separates hitter stats and pitcher stats to make the data structure more realistic.
Authenticated users can manage player data, while public users can browse and search players.

## Screenshots

Screenshots will be added here.

```txt
docs/screenshots/home-page.png
docs/screenshots/players-page.png
docs/screenshots/player-detail-page.png
```

## Features

- Search players by name, team, or position
- Filter players by team, position, and player type
- Sort hitters by batting average and home runs
- Sort pitchers by ERA and strikeouts
- View player details
- Register and login users
- Store authentication data with JWT
- Protect create, update, and delete operations
- Add new players as an authenticated user
- Edit player information as an authenticated user
- Delete players as an authenticated user
- Store player data in MongoDB
- Run MongoDB with Docker Compose
- Style the UI with Tailwind CSS and Catppuccin Mocha colors

## Tech Stack

- Frontend: React, Vite, React Router
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Authentication: JWT, bcryptjs
- Development: Docker, Docker Compose
- Styling: Tailwind CSS, CSS, Catppuccin Mocha, Maple Mono NF
- Deployment: Vercel, Render, MongoDB Atlas

## Project Structure

```txt
mlb-app
├── backend
│   ├── config
│   ├── controllers
│   ├── data
│   ├── models
│   ├── routes
│   └── server.js
├── frontend
│   └── src
│       ├── components
│       ├── pages
│       └── utils
└── docker-compose.yml
```

## Setup

Start MongoDB with Docker:

```bash
docker compose up -d
```

Install backend dependencies and seed the database:

```bash
cd backend
npm install
node seedPlayers.js
npm run dev
```

Install frontend dependencies and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the app:

```txt
http://localhost:5173
```

## Environment Variables

Create `backend/.env`:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/mlbApp
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5001
```

For production, the frontend uses the Render backend URL, and the backend uses the Vercel frontend URL for CORS.

```txt
Vercel Frontend -> Render Backend -> MongoDB Atlas
```

## Authentication

Users can register and login through the backend auth API.

```txt
POST /api/auth/register
POST /api/auth/login
```

After login, the frontend stores the JWT and user information in local storage.
Protected player actions send the token with the `Authorization` header.

```txt
Authorization: Bearer <token>
```

Create, update, and delete routes are protected by backend middleware.
Public users can still view, search, filter, and sort players.

## Design Notes

- I separated route definitions and controller logic on the backend.
- I split frontend UI into reusable components.
- I separated hitter stats and pitcher stats instead of using one common stats object.
- I used Docker Compose to make MongoDB easier to run locally.
- I organized auth-related localStorage logic into a frontend utility file.
- I introduced Tailwind CSS gradually while keeping the existing Catppuccin-based design system.
- I deployed the frontend, backend, and database separately to match a real MERN deployment flow.

## Future Improvements

- Improve authentication with role-based access control
- Add user profile UI
- Add screenshots
- External MLB API integration
- Tests
