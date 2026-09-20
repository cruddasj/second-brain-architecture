FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv git \
    && python3 -m venv /opt/validation \
    && rm -rf /var/lib/apt/lists/*
ENV PATH="/opt/validation/bin:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /workspace
COPY 2.core/scripts/requirements.txt ./2.core/scripts/
RUN python -m pip install --no-cache-dir -r 2.core/scripts/requirements.txt
COPY 3.add-ons/browser-explorer/package*.json ./3.add-ons/browser-explorer/
RUN npm --prefix 3.add-ons/browser-explorer ci
COPY . .
# Build a disposable index: never copy host Git history or credentials.
RUN git init && git add . && chown -R node:node /workspace
USER node
EXPOSE 3000
CMD ["npm", "--prefix", "3.add-ons/browser-explorer", "run", "dev", "--", "--hostname", "0.0.0.0"]
