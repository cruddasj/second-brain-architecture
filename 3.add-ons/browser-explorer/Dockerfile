FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 git \
    && ln -s /usr/bin/python3 /usr/local/bin/python \
    && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /workspace
COPY 3.add-ons/browser-explorer/package*.json ./3.add-ons/browser-explorer/
RUN npm --prefix 3.add-ons/browser-explorer ci
COPY . .
# Build a disposable index: never copy host Git history or credentials.
RUN git init && git add . && chown -R node:node /workspace
USER node
EXPOSE 3000
CMD ["npm", "--prefix", "3.add-ons/browser-explorer", "run", "dev", "--", "--hostname", "0.0.0.0"]
