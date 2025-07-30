# Ultra rápido - imagen que ya tiene todo
FROM ghcr.io/puppeteer/puppeteer:20.9.0

USER root

# Solo instalar lo mínimo adicional
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copiar solo package.json primero
COPY package.json ./

# NPM install súper rápido (imagen ya tiene puppeteer)
RUN npm install --omit=dev --no-audit --no-fund

# Copiar código
COPY . .

USER pptruser

EXPOSE 3000

CMD ["node", "server.js"]
