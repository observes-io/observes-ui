# Use official Node.js image for build
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Use official Nginx image for serving static files
FROM nginx:1.29.1-alpine3.22-slim

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

USER daemon

CMD ["nginx", "-g", "daemon off;"]
