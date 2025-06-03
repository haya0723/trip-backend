# Use an official Node.js runtime as a parent image
# Using a Long Term Support (LTS) version is recommended for stability
FROM node:20-alpine AS builder

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
# If you use yarn, replace 'npm install' with 'yarn install --frozen-lockfile'
RUN npm install

# Copy the rest of the application code
COPY . .

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy built assets from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/src ./src

# Expose the port the app runs on
# This should match the PORT in your .env file or your app's configuration
EXPOSE 3001

# Define the command to run your app
# This might be 'npm start' or 'node src/index.js' depending on your package.json scripts
CMD [ "node", "src/index.js" ]
