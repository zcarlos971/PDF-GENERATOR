# Alpine con Chromium - Sin problemas de GPG
FROM node:18-alpine

# Instalar Chromium y dependencias
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    CHROMIUM_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar dependencias de Node
RUN npm ci --only=production

# Copiar código
COPY . .

# Crear usuario no-root
RUN addgroup -g 1000 carsimulcast && \
    adduser -D -s /bin/sh -u 1000 -G carsimulcast carsimulcast && \
    chown -R carsimulcast:carsimulcast /app

USER carsimulcast

EXPOSE 3000

CMD ["npm", "start"]
