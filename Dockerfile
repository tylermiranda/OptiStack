FROM node:20-bookworm-slim

WORKDIR /app

# Install Chromium for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy package files and install ALL dependencies once
COPY package*.json ./
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "server.js"]
