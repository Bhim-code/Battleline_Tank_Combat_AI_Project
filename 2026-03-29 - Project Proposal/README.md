# Motivation

Our team proposes Battleline_Tank_Combat, a browser-based tank combat game where the player
controls a tank and survives against AI-controlled enemy units in a live battlefield. We selected this
idea because it is both technically realistic and engaging to play. It gives us a clear way to combine
game mechanics, artificial intelligence, account management, saved progress, and deployment into
one focused project. It also gives us room to learn modern collaborative development practices,
including vibe coding, where AI tools can support brainstorming, prototyping, debugging, and
iteration while the team remains responsible for design, review, and final decisions.

# Core Functionality

The system will provide a complete browser-playable combat experience. Players will drive a tank,
aim and fire shells, avoid hazards, collect first-aid pickups, and survive through increasing combat
waves. The game will include a combat HUD with armor, score, wave count, ammo, kills, enemy
count, and status updates so gameplay information stays clear at all times. Players will also be able to
create an account, log in, and continue from their most recent saved session.

# AI System

A major part of the project is the enemy AI. Rather than using only simple scripted reactions, the

game will use a structured tactical AI system that combines grid-based A* pathfinding with utility-
based decision making. Enemy tanks will evaluate actions such as chasing, attacking, flanking,

retreating, seeking cover, and repositioning based on health, distance, visibility, and map layout.
Different enemy classes such as scout, standard, and heavy units will use different tactical weights so
their behavior feels distinct and meaningful during play.

# Technical Architecture

The frontend will be built with HTML, CSS, and JavaScript, and the main rendering system will be
HTML Canvas. Canvas will be used to draw the battlefield, tanks, bullets, effects, pickups, HUD
feedback, and other live gameplay elements directly in the browser. On the backend, Node.js with
Express.js will handle account creation, login, and save/load routes. MongoDB will store usernames,
passwords, and progress data. A Dockerfile will package the full application so it can be deployed and
run consistently.

# Development Approach

Our development plan is to build the project in layers so the system stays stable while features grow.
We will first complete the core gameplay loop, then refine the AI, then connect login and saved
progress, and finally prepare the full project for Docker deployment. Throughout the process, we will
use AI-assisted development tools such as ChatGPT and Claude to help with brainstorming, debugging,
code refinement, and prompt engineering. This supports faster iteration, but the design choices,
testing, integration, and final implementation decisions will remain with our team.