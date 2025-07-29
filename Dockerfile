# Usar una imagen base más simple y confiable
FROM node:18-slim

# Establecer el directorio de trabajo
WORKDIR /app

# Instalar dependencias básicas
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    software-properties-common

# Agregar el repositorio de Google Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

# Actualizar e instalar Chrome y dependencias
RUN apt-get update && apt-get install -y \
    google-chrome-stable \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libgbm1 \
    libxss1 \
    fonts-dejvu-core \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm ci --only=production

# Copiar el resto de la aplicación
COPY . .

# Cambiar permisos
RUN chown -R pptruser:pptruser /app

# Configurar variables de entorno
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV NODE_ENV=production

# Exponer el puerto
EXPOSE 3000

# Cambiar al usuario no-root
USER pptruser

# Comando para iniciar la aplicación
CMD ["npm", "start"]
