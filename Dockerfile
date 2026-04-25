# ---- Stage 1: Build the React app ----
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# VITE_API_URL=/api tells the built app to call /api (relative)
# nginx will proxy /api → backend:3001/api
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Stage 2: Serve with nginx ----
FROM nginx:1.27-alpine

# Copy the built React app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom nginx config (handles SPA routing + API proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
