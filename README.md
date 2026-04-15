# 🎮 Battleline: Tank Combat AI

=======
> ## 🧭 Overview

**Battleline** is a full-stack browser game where you pilot a tank through waves of increasingly difficult AI-controlled enemies. The enemy AI uses **A\* pathfinding** and **utility-based decision-making** to navigate the map, flank, retreat, and attack — making every match feel dynamic.

Players can create accounts, save scores after each session, and track their performance on a profile page. The entire stack runs locally with a single Docker command.

---

Project Group Members:

* Group Member Bhim Kandel (202488138 #, bkandel@mun.ca)
* Group Member Usmani, Muhammad Awais (202388938 #, ausmani@mun.ca)

Project URL

http://23.22.69.70

Project Videos:

* Project Presentation: YouTube URL
https://youtu.be/F_fd2GVeyXk

Project Setup / Installation:



---

## ✨ Features

- 🤖 **Enemy AI** — A\* grid pathfinding + utility-based action selection (chase, attack, flank, cover, retreat, reposition)
- 🪖 **3 Enemy Types** — Scout (fast flanker), Standard (balanced), Heavy (slow bruiser), each with unique AI weights
- 🔐 **Authentication** — Signup/login with bcrypt-hashed passwords and JWT session tokens
- 📊 **Persistent Stats** — High score, kills, games played, wave reached, and last 20 sessions stored in MongoDB
- 🎯 **Independent Turret** — Mouse-aimed turret decoupled from hull movement with optional aim assist
- 🌑 **Dark/Light Theme** — Full UI theme toggle
- 🐳 **Docker Ready** — One command spins up the app + MongoDB together

---

## 🛠 Tech Stack

| Layer      | Technology                                       |
|------------|--------------------------------------------------|
| Frontend   | Vanilla HTML5, CSS3, JavaScript (Canvas API)     |
| Backend    | Node.js 20, Express 4                            |
| Database   | MongoDB 7 via Mongoose 8                         |
| Auth       | bcryptjs, JSON Web Tokens (JWT)                  |
| DevOps     | Docker, Docker Compose                           |

---

## 📁 Project Structure

```
my-Battleline-tank-game/
│
├── client/                        # Frontend — served as static files by Express
│   ├── index.html                 # Entry point — redirects based on auth state
│   ├── login.html                 # Login page
│   ├── signup.html                # Registration page
│   ├── game.html                  # Main game canvas
│   ├── profile.html               # Player stats dashboard
│   │
│   ├── css/
│   │   ├── styles.css             # Shared / global styles + theme variables
│   │   ├── auth.css               # Login & signup page styles
│   │   ├── game.css               # HUD, canvas, overlays
│   │   └── profile.css            # Stats page layout
│   │
│   └── js/
│       ├── api.js                 # All fetch() calls to the backend
│       ├── auth.js                # Login / signup form logic
│       ├── main.js                # Constants, math helpers, obstacle definitions
│       ├── controls.js            # Keyboard + mouse input capture
│       ├── turret.js              # Turret aiming + optional aim assist
│       ├── player.js              # Player tank movement (world-space velocity)
│       ├── enemy.js               # A* pathfinding + utility-based AI
│       ├── bullets.js             # Bullet physics, pickups, particle effects
│       ├── ui.js                  # Canvas rendering, HUD drawing
│       ├── game.js                # Main game loop + score saving on death
│       ├── profile.js             # Profile page data loading
│       └── theme.js               # Dark/light mode toggle
│
├── server/
│   ├── server.js                  # Express app entry point
│   ├── db.js                      # MongoDB connection via Mongoose
│   ├── package.json               # Node dependencies
│   ├── .env.example               # Template — copy to .env and fill in values
│   │
│   ├── api/
│   │   ├── auth.js                # POST /api/auth/signup  &  /api/auth/login
│   │   ├── users.js               # GET  /api/users/profile
│   │   └── game.js                # POST /api/game/save  &  GET /api/game/stats
│   │
│   ├── models/
│   │   ├── User.js                # Mongoose schema: name, email, hashed password
│   │   ├── GameStats.js           # Mongoose schema: scores, kills, sessions[]
│   │   └── GameState.js           # Mongoose schema: checkpoint / resume state
│   │
│   ├── game/
│   │   └── scoreService.js        # Server-side score plausibility validation
│   │
│   └── utils/
│       ├── auth.js                # bcrypt hash/compare + JWT sign/verify helpers
│       └── middleware.js          # protect() — JWT guard for private routes
│
└── docker/
    ├── Dockerfile                 # Node 20-slim image for the app container
    └── docker-compose.yml         # Orchestrates app + mongo:7 together
```

---

## 📦 Prerequisites

Choose the setup path that fits you — Docker is strongly recommended because it handles MongoDB automatically.

### For Docker (Option A)

| Tool | Version | Download |
|------|---------|----------|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |

> Docker Desktop includes Docker Compose. No separate install needed.

### For Local Dev (Option B)

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18 or 20 LTS | https://nodejs.org |
| MongoDB Community | 6 or 7 | https://www.mongodb.com/try/download/community |

> After installing MongoDB, make sure the service is running before starting the server.

---

## 🐳 Setup: Option A — Docker (Recommended)

This is the fastest way to get everything running. Docker will spin up both the Node.js app and a MongoDB database automatically.

**Step 1 — Clone or extract the project**

```bash
# If cloning from GitHub:
git clone <your-repo-url>
cd my-Battleline-tank-game

# Or if you extracted the ZIP:
cd Battleline_Tank_Combat_AI_Project/my-Battleline-tank-game
```

**Step 2 — Build and start the containers**

```bash
docker compose -f docker/docker-compose.yml up --build
```

This will:
- Build the Node.js application image
- Pull the official MongoDB 7 image
- Start both containers and link them together

**Step 3 — Open the game**

```
http://localhost:3000
```

**Step 4 — Stop the containers when done**

```bash
docker compose -f docker/docker-compose.yml down
```

> Your MongoDB data is stored in a Docker volume (`mongo_data`) and will persist between restarts.

---

## 💻 Setup: Option B — Local (No Docker)

Use this if you prefer to run Node.js and MongoDB directly on your machine.

**Step 1 — Verify Node.js is installed**

```bash
node --version   # should print v18.x or v20.x
npm --version
```

If not installed, download from https://nodejs.org and install the LTS version.

**Step 2 — Start MongoDB**

Make sure MongoDB is running locally on port `27017`. How to start it depends on your OS:

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu / Debian
sudo systemctl start mongod

# Windows
# Start "MongoDB" from the Services panel, or run:
net start MongoDB
```

**Step 3 — Clone or extract the project**

```bash
cd Battleline_Tank_Combat_AI_Project/my-Battleline-tank-game
```

**Step 4 — Install backend dependencies**

```bash
cd server
npm install
```

**Step 5 — Create your `.env` file**

```bash
# From inside the server/ directory:
cp .env.example .env
```

Now open `server/.env` in any text editor and set:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/tankfrontline
JWT_SECRET=replace_this_with_a_long_random_secret_string
```

> ⚠️ Never commit your `.env` file to Git. It's already listed in `.gitignore`.

**Step 6 — Start the server**

```bash
# From inside the server/ directory:
npm start
```

You should see:

```
[Server] Tank Frontline running on http://localhost:3000
[Server] Open your browser at http://localhost:3000
```

**Step 7 — Open the game**

```
http://localhost:3000
```

---

## 🔑 Environment Variables

The server reads these from `server/.env` (local) or from `docker-compose.yml` (Docker).

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port Express listens on |
| `MONGO_URI` | `mongodb://mongo:27017/tankfrontline` | MongoDB connection string |
| `JWT_SECRET` | *(none)* | Secret used to sign JWT tokens — **change this before deploying** |

> For local development, `MONGO_URI` should be `mongodb://localhost:27017/tankfrontline`.
> For Docker, it should be `mongodb://mongo:27017/tankfrontline` (uses the service name `mongo`).

---

## 🕹 Game Controls

| Input | Action |
|-------|--------|
| `W` / `↑` | Drive forward |
| `S` / `↓` | Reverse |
| `A` / `←` | Rotate hull left |
| `D` / `→` | Rotate hull right |
| **Mouse** | Aim turret independently |
| **Left Click** / `Space` | Fire |

**Movement note:** The tank uses **world-space velocity** — rotating the hull mid-move does not snap or flip the direction of travel.

---

## 🤖 AI System

Enemy AI is implemented in `client/js/enemy.js` and runs entirely in the browser.

### Pathfinding — A\*

The map is divided into a **28 × 28 px navigation grid**. At the start of each wave, `buildNavGrid()` marks cells blocked by obstacles (with a margin for tank clearance). The `astar()` function then finds the shortest traversable path between any two world-space points.

### Decision Making — Utility AI

Every frame, each enemy evaluates **6 possible actions** using `scoreActions()`:

| Action | Description |
|--------|-------------|
| **Chase** | Move directly toward the player |
| **Attack** | Hold position and fire if in range |
| **Flank** | Approach from a side angle |
| **Cover** | Move toward the nearest obstacle |
| **Retreat** | Fall back when health is low |
| **Reposition** | Break line-of-sight and reset |

Each action receives a numeric utility score based on distance, health, line-of-sight, and ammo. `pickAction()` selects the highest scorer each frame.

### Enemy Types

| Type | Speed | Health | Behavior |
|------|-------|--------|----------|
| **Scout** | Fast | Low | Heavily weights flanking and repositioning |
| **Standard** | Medium | Medium | Balanced weights across all actions |
| **Heavy** | Slow | High | Heavily weights attack and cover |

---

## 📡 API Reference

All API routes are served at `http://localhost:3000/api`.

| Method | Route | Auth Required | Description |
|--------|-------|:---:|-------------|
| `POST` | `/api/auth/signup` | ❌ | Register a new account |
| `POST` | `/api/auth/login` | ❌ | Login and receive a JWT |
| `GET` | `/api/users/profile` | ✅ | Fetch the logged-in user's info |
| `POST` | `/api/game/save` | ✅ | Save a score after a game session |
| `GET` | `/api/game/stats` | ✅ | Load the player's lifetime stats |

**Authentication:** Protected routes require an `Authorization: Bearer <token>` header. The JWT is issued at login and stored in `localStorage` on the client.

**Score Validation:** The `POST /api/game/save` route runs `isScorePlausible()` server-side to sanity-check submitted scores against the wave and kill count — preventing trivial score tampering.

---



## 🚀 Deployment Checklist

Before pushing to production or submitting:

- [ ] Replace `JWT_SECRET` in your environment with a long random string
- [ ] Confirm `docker compose up --build` runs cleanly and the app opens at `http://localhost:3000`
- [ ] Test signup → login → play game → score saved → profile page shows stats → logout
- [ ] Verify `.env` is in `.gitignore` and only `.env.example` is committed
- [ ] Add your hosted URL and video presentation link to the top-level `README.md`


