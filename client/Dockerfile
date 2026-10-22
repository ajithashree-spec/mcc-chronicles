# Production Client Nginx Dockerfile (Task 132)
# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy client source and build production bundle
COPY . .
RUN npm run build

# Stage 2: Serve via High-Performance Nginx Alpine
FROM nginx:alpine AS production

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
