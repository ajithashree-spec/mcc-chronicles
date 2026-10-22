# Production Server Dockerfile (Task 131)
# Base Image: Node.js 20 LTS Alpine
FROM node:20-alpine AS base

# Install dumb-init for clean PID 1 signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create persistent storage directories for uploads and backups
RUN mkdir -p uploads backups

# Set up non-root security user
RUN addgroup -g 1001 -S mccgroup && \
    adduser -u 1001 -S mccnode -G mccgroup && \
    chown -R mccnode:mccgroup /app

USER mccnode

EXPOSE 5000

# Use dumb-init to handle process signals cleanly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
