# McK Self-Service Portal

This is a Vue.js application for a self-service portal, integrating with PacketFence.

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

Create a `.env` file in the root directory with the following variables for PacketFence integration:

```
VUE_APP_PACKETFENCE_URL=https://your-packetfence-url
VUE_APP_PACKETFENCE_USERNAME=your-admin-username
VUE_APP_PACKETFENCE_PASSWORD=your-admin-password
``` 