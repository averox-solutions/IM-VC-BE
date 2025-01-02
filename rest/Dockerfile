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

# Copy the rest of the application code
COPY rest/ rest/

# Copy the models of the application code
COPY models/ models/


# Existing Dockerfile content...
# Add this line to copy the .env file
COPY .env /app/.env

# Expose the port the app runs on
EXPOSE 8000

# Command to run the server
CMD ["node", "rest/server.js"]