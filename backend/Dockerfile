# Use official Node.js LTS (Long Term Support) image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Set the port for the container
ENV PORT=5000

# Expose the port your app runs on (adjust if different)
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]