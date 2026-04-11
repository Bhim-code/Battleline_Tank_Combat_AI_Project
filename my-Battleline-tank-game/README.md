# Tank Frontline

Early full-stack setup for the Tank Frontline browser game.

## Local run
```bash
cd server
npm install
npm start
```

Open `http://localhost:3000`.


# Add MongoDB connection and environment-aware server

## Pre-release checklist

- Run the stack with Docker Compose and confirm the app opens on `http://localhost:3000`.
- Verify signup, login, profile loading, score saving, logout, and resume flow.
- Keep local secrets in `server/.env` and commit only `server/.env.example`.

---

## Project Structure

```
tank-frontline/
├── client/                  # Frontend (served as static files)
│   ├── index.html           # Redirect page
│   ├── login.html           # Login page
│   ├── signup.html          # Registration page
│   ├── game.html            # Main game page
│   ├── profile.html         # Player stats page
│   ├── css/
│   │   ├── styles.css       # Shared styles
│   │   ├── auth.css         # Login/signup styles
│   │   ├── game.css         # Game page styles
│   │   └── profile.css      # Profile page styles
│   └── js/
│       ├── api.js           # All fetch calls to backend
│       ├── auth.js          # Login/signup logic
│       ├── main.js          # Constants, math helpers, obstacles
│       ├── controls.js      # Keyboard/mouse input
│       ├── turret.js        # Turret aiming + aim assist
│       ├── player.js        # Player movement (world-space velocity)
│       ├── enemy.js         # A* pathfinding + utility AI
│       ├── bullets.js       # Bullets, pickups, effects
│       ├── ui.js            # Canvas drawing, HUD
│       ├── game.js          # Game loop + score saving
│       └── profile.js       # Profile page logic
│
├── server/
│   ├── server.js            # Express entry point
│   ├── db.js                # MongoDB connection
│   ├── package.json
│   ├── .env.example         # Copy to .env and fill in values
│   ├── api/
│   │   ├── auth.js          # POST /api/auth/signup, /api/auth/login
│   │   ├── users.js         # GET  /api/users/profile
│   │   └── game.js          # POST /api/game/save, GET /api/game/stats
│   ├── models/
│   │   ├── User.js          # name, email, hashed password
│   │   └── GameStats.js     # highScore, kills, sessions[]
│   ├── game/
│   │   └── scoreService.js  # Score plausibility check
│   └── utils/
│       ├── auth.js          # bcrypt + JWT helpers
│       └── middleware.js    # JWT protect middleware
│
└── docker/
    ├── Dockerfile           # Node app container
    └── docker-compose.yml   # App + MongoDB together
```

---

## Quick Start (Local — No Docker)

### Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017

```bash
# 1. Install backend dependencies
cd server
npm install

# 2. Create your .env file
cp .env.example .env
# Edit .env: set MONGO_URI=mongodb://localhost:27017/tankfrontline

# 3. Start the server
npm start
# or for development with auto-reload:
npm run dev

# 4. Open your browser
# http://localhost:3000
```

---

## Quick Start (Docker — Recommended)

```bash
# From the project root (tank-frontline/)
docker compose -f docker/docker-compose.yml up --build

# Open your browser at:
# http://localhost:3000
```

To stop:
```bash
docker compose -f docker/docker-compose.yml down
```

---

## How It Works

### Authentication
1. Register on `/signup.html` → hashed password stored in MongoDB → JWT issued
2. Login on `/login.html` → JWT stored in `localStorage`
3. Every API call sends the JWT as `Authorization: Bearer <token>`
4. On logout, token is cleared and user is redirected to login

### Score Persistence
- Score is automatically saved to MongoDB when the player dies
- `GameStats` document stores: high score, latest score, total kills, best wave, games played, and the last 20 sessions
- Profile page (`/profile.html`) displays all saved stats

### AI System
- **A\* pathfinding** — enemies navigate the map using a 28px grid with obstacle clearance
- **Utility-based decisions** — 6 actions (chase, attack, flank, cover, retreat, reposition) scored each frame
- **Three enemy types** — Scout (fast flanker), Standard (balanced), Heavy (slow bruiser), each with different AI weights

### Tank Controls
- **W / ↑** — Drive forward (always toward hull front, never reverses on rotate)
- **S / ↓** — Reverse
- **A / D** — Rotate hull
- **Mouse** — Aim turret independently
- **Left Click / Space** — Fire

The movement uses **world-space velocity** — rotating the hull does not flip the perceived forward direction.

---

## API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/signup` | No | Register new user |
| POST | `/api/auth/login`  | No | Login, receive JWT |
| GET  | `/api/users/profile` | Yes | Get user info |
| POST | `/api/game/save`   | Yes | Save score after game |
| GET  | `/api/game/stats`  | Yes | Load player stats |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the server listens on |
| `MONGO_URI` | `mongodb://mongo:27017/tankfrontline` | MongoDB connection string |
| `JWT_SECRET` | — | Secret key for signing JWTs (change in production) |
