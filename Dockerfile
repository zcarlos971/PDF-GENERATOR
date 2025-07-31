# Alpine con Chromium - Sin problemas de GPG
FROM node:18-alpine

# Instalar Chromium y dependencias necesarias para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Variables de entorno necesarias para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    CHROMIUM_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar dependencias (solución al problema)
RUN npm install --production

# Copiar el resto del código
COPY . .

# Crear un usuario sin privilegios
RUN addgroup -g 1000 carsimulcast && \
    adduser -D -s /bin/sh -u 1000 -G carsimulcast carsimulcast && \
    chown -R carsimulcast:carsimulcast /app

# Ejecutar como usuario no root
USER carsimulcast

# Exponer el puerto de la app
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
