# Base Node con Alpine
FROM node:18-alpine

# Instalamos dependencias por bloques para evitar timeout
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz

RUN apk add --no-cache \
    ca-certificates \
    freetype-dev \
    ttf-freefont \
    font-noto-emoji

# Variables necesarias para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    CHROMIUM_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Directorio de trabajo
WORKDIR /app

# Copiar dependencias
COPY package.json ./

# Instalar dependencias sin errores
RUN npm install --production

# Copiar el resto del código
COPY . .

# Evitamos conflictos con el UID/GID 1000
RUN adduser -D -s /bin/sh carsimulcast && \
    chown -R carsimulcast:carsimulcast /app

# Ejecutar como usuario sin root
USER carsimulcast

# Puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
