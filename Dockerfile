# Usar una imagen base de Node.js con soporte completo para Puppeteer
FROM node:18-bullseye

# Establecer el directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias para Puppeteer y navegadores
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libgconf-2-4 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    libcups2 \
    libdrm2 \
    libgtk-3-0 \
    libgtk-4-1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    libgbm1 \
    fonts-liberation \
    fonts-dejavu-core \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Instalar Google Chrome estable
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/chrome.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm install

# Instalar Puppeteer y descargar Chromium
RUN npx puppeteer browsers install chrome

# Copiar el resto de la aplicación
COPY . .

# Crear usuario no-root para ejecutar la aplicación (seguridad)
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Configurar variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV NODE_ENV=production

# Exponer el puerto
EXPOSE 3000

# Cambiar al usuario no-root
USER pptruser

# Comando para iniciar la aplicación
CMD ["npm", "start"]
