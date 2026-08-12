FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 8080

ENV PACKETFENCE_IGNORE_SSL=true
ENV NODE_ENV=production

CMD [ "node", "server.js" ]
