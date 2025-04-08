# Use an official Node.js runtime as a parent image (choose a version)
# Using LTS (Long Term Support) versions is generally recommended
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
# Use a clean install if possible (npm ci) for better reproducibility
# If you face issues with npm ci, fall back to npm install
RUN npm ci

# Bundle app source code inside the Docker image
COPY . .

# Build the Vue.js application for production
# This creates the static files in the /dist directory
RUN npm run build

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Define environment variables (defaults, can be overridden at runtime)
# These should ideally be passed during docker run or via docker-compose
# ENV VUE_APP_PACKETFENCE_USERNAME=your_default_pf_user
# ENV VUE_APP_PACKETFENCE_PASSWORD=your_default_pf_password
ENV VUE_APP_PACKETFENCE_API_URL=https://172.22.10.176:1443/api/v1
ENV PACKETFENCE_IGNORE_SSL=true
ENV NODE_ENV=production

# Run the server script when the container launches
CMD [ "node", "server.js" ] 