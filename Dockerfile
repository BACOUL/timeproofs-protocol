FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

RUN mkdir -p /data && chown -R node:node /app /data

USER node

ENV HOST=0.0.0.0 \
    PORT=8787 \
    TIMEPROOFS_RELAY_DATA_DIR=/data \
    TIMEPROOFS_RELAY_ISSUER=urn:timeproofs:relay:docker

EXPOSE 8787
VOLUME ["/data"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "packages/relay/bin/timeproofs-relay.mjs"]
