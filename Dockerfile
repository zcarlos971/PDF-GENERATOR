# Imagen base con Node y Alpine
FROM node:18-alpine

# Instalar Chromium y fuentes necesarias
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
    CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Crear directorio de trabajo
WORKDIR /app

# Copiar dependencias
COPY package.json ./
COPY package-lock.json ./

# Instalar dependencias sin errores
RUN npm ci --omit=dev || npm install --production

# Copiar todo el proyecto
COPY . .

# Usar un UID/GID aleatorio para evitar conflicto con Railway
RUN adduser -D -s /bin/sh -u 1001 -G root appuser && \
    chown -R appuser:root /app

USER appuser

EXPOSE 3000

CMD ["npm", "start"]
