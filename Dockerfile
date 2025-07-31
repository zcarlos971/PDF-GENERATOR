# Base Node con Alpine
FROM node:18-alpine

# Instalar Chromium y dependencias necesarias
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    freetype-dev

# Variables necesarias para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    CHROMIUM_PATH=/usr/bin/chromium \
    NODE_ENV=production

# Directorio de trabajo
WORKDIR /app

# Copiar dependencias
COPY package.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

# Corregir permisos para evitar errores con Puppeteer
RUN adduser -D -s /bin/sh carsimulcast && \
    chown -R carsimulcast:carsimulcast /app

# Usar usuario no root
USER carsimulcast

# Puerto expuesto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
