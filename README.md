# McK Self-Service Portal

This is a Vue.js application allowing guests to self-register for WiFi access by creating a temporary user account in PacketFence.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

## Environment Variables

When running locally using `npm run serve`, create a `.env` file in the root directory with the following variables used by the development server's internal API (`vue.config.js`):

```dotenv
# Required PacketFence API credentials for the dev server
VUE_APP_PACKETFENCE_USERNAME=your-admin-username
VUE_APP_PACKETFENCE_PASSWORD=your-admin-password

# Required: Set PacketFence API URL (e.g., https://your-packetfence-ip:1443/api/v1)
# No default is provided in vue.config.js anymore
VUE_APP_PACKETFENCE_API_URL=https://your-packetfence-url:1443/api/v1 
```

When running via Docker (using `server.js`), the following environment variables are needed (passed via `docker run -e` or `docker-compose`):

```dotenv
# Required PacketFence API credentials for the production server
VUE_APP_PACKETFENCE_USERNAME=your-admin-username
VUE_APP_PACKETFENCE_PASSWORD=your-admin-password

# Required: PacketFence API URL (No default is provided)
VUE_APP_PACKETFENCE_API_URL=https://your-packetfence-url:1443/api/v1

# Optional: Set to false if PacketFence uses a valid, trusted SSL certificate
PACKETFENCE_IGNORE_SSL=true 

# Optional: Port for the Node.js server inside the container (Defaults to 8080)
# PORT=8080
```

## Docker Usage

1.  **Build the Docker image after cloning the repository:**
    ```bash
    docker build -t mckselfservice-app:latest .
    ```

2.  **Run the container:**
    ```bash
    docker run -d -p 8080:8080 \
      -e VUE_APP_PACKETFENCE_USERNAME="YOUR_PF_ADMIN_USERNAME" \
      -e VUE_APP_PACKETFENCE_PASSWORD="YOUR_PF_ADMIN_PASSWORD" \
      -e VUE_APP_PACKETFENCE_API_URL="https://your-packetfence-url:1443/api/v1" \
      --name mckselfservice-app \
      --restart=unless-stopped \
      alastairtech/mckselfservice-app:latest
    ```
    *   Replace `YOUR_PF_ADMIN_USERNAME`, `YOUR_PF_ADMIN_PASSWORD`, and the `VUE_APP_PACKETFENCE_API_URL` value with your actual PacketFence details.
    *   `-d` runs the container in detached mode.
    *   `-p 8080:8080` maps the host port 8080 to the container's port 8080.
    *   You can optionally add `-e PACKETFENCE_IGNORE_SSL=false` if needed.
    *   `--restart=unless-stopped` ensures the container restarts automatically if it stops, unless manually stopped.

3.  **Access the application:**
    Open your browser and navigate to `http://<your-docker-host-ip>:8080` (or `http://localhost:8080` if running locally). 
