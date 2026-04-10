# ============================================================
# Dockerfile — Tank Frontline Node.js application
# ============================================================

# Use official Node LTS (slim = smaller image)
FROM node:20-slim

# Set working directory inside the container
WORKDIR /app

# Copy package files first (layer caching — only reinstalls if deps change)
COPY server/package*.json ./server/

# Install production dependencies
RUN cd server && npm install --omit=dev

# Copy the rest of the project
COPY server/ ./server/
COPY client/ ./client/

# Set working directory to server for the start command
WORKDIR /app/server

# Expose the port Express listens on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
