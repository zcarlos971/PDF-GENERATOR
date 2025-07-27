# Usa Node.js con Puppeteer compatible
FROM node:20-slim

# Instala dependencias requeridas por Chromium
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Crea carpeta de trabajo
WORKDIR /app

# Copia archivos de tu proyecto
COPY . .

# Instala dependencias de Node.js
RUN npm install

# Expone el puerto 3000 (ajústalo si usas otro)
EXPOSE 3000

# Comando de arranque
CMD ["node", "server.js"]
