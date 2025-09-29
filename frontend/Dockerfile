# Multi-stage build for React app

# Stage 1: Build the React app
FROM node:22-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for production build
ENV NODE_ENV=production

# Build the app with more memory and debugging
RUN npm run build 2>&1 || (echo "Build failed, checking files:" && ls -la && exit 1)

# Stage 2: Serve the built app
FROM nginx:alpine

# Copy built files from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration if needed (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 5173

# Start nginx
CMD ["nginx", "-g", "daemon off;"]