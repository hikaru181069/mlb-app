# MLB Player Search App

A MERN stack portfolio app for searching and managing MLB player data.

## Overview

This app allows users to search, filter, sort, create, update, and delete MLB player data.
It uses local MongoDB data instead of an external API.

The app separates hitter stats and pitcher stats to make the data structure more realistic.

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
- Add new players
- Edit player information
- Delete players
- Store player data in MongoDB
- Run MongoDB with Docker Compose

## Tech Stack

- Frontend: React, Vite, React Router
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Development: Docker, Docker Compose
- Styling: CSS, Catppuccin Mocha, Maple Mono NF

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
```

## Design Notes

- I separated route definitions and controller logic on the backend.
- I split frontend UI into reusable components.
- I separated hitter stats and pitcher stats instead of using one common stats object.
- I used Docker Compose to make MongoDB easier to run locally.

## Future Improvements

- Authentication and authorization
- Admin-only CRUD operations
- External MLB API integration
- Deployment
- Tests
