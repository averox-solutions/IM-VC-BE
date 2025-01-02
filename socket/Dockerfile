# Use official Node.js image
FROM node:18

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json from the project root
COPY package*.json /app/

# Copy root-level configuration files
COPY db.js /app/
COPY redis.js /app/

# Install dependencies
RUN npm install

# Copy the socket server files
COPY socket/ socket/


# Existing Dockerfile content...
# Add this line to copy the .env file
COPY .env /app/.env


# Expose the port the socket server runs on
EXPOSE 8080

# Command to run the socket server
CMD ["node", "socket/server.js"]