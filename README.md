# McK Self-Service Portal

Vue 3 SPA that lets staff self-register a WiFi account in PacketFence. `server.js`
serves the built SPA and owns the PacketFence calls — PacketFence admin credentials
never reach the browser.

Identity comes from Pangolin's `Remote-Email` / `Remote-Role` headers, so the app
has no login of its own and must not be exposed directly.

## Setup

```bash
npm install
cp .env.sample .env   # then fill it in
```

## Development

Two processes — the API and the dev server, which proxies `/api-internal` to it:

```bash
npm run dev:api   # server.js on :8080, reads .env
npm run serve     # dev server on :8081 — open that one
```

```bash
npm test          # expiry-date maths
npm run lint
```

## Environment

See `.env.sample`. Required:

| Variable | Purpose |
| --- | --- |
| `VUE_APP_PACKETFENCE_USERNAME` | PacketFence API user |
| `VUE_APP_PACKETFENCE_PASSWORD` | PacketFence API password |
| `VUE_APP_PACKETFENCE_API_URL` | e.g. `https://packetfence:1443/api/v1` |
| `NEWT_ID` / `NEWT_SECRET` / `PANGOLIN_ENDPOINT` | Newt tunnel (Pangolin → Sites → Add Site → Newt) |

Optional: `PACKETFENCE_IGNORE_SSL=true` for a self-signed or private-CA PacketFence
certificate. The Dockerfile defaults it to `true`.

## Deployment

```bash
docker compose up -d --build
```

The app container publishes no ports; the `newt` container tunnels it to Pangolin,
which is the only ingress.
