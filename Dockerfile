# Dockerfile optimizado para Carsimulcast HTML to PDF
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias básicas
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    software-properties-common

# Instalar Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Instalar Google Chrome (necesario para cargar recursos de Carsimulcast)
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable

# Instalar dependencias para Puppeteer y recursos multimedia
RUN apt-get install -y \
    fonts-liberation \
    fonts-dejavu-core \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
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
    libgconf-2-4

# Instalar certificados SSL adicionales para conectar con Carsimulcast
RUN apt-get install -y \
    ca-certificates-java \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario específico
RUN groupadd -r carsimulcast && useradd -r -g carsimulcast -G audio,video carsimulcast \
    && mkdir -p /home/carsimulcast/Downloads \
    && chown -R carsimulcast:carsimulcast /home/carsimulcast

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm install --production

# Copiar aplicación
COPY . .

# Cambiar permisos
RUN chown -R carsimulcast:carsimulcast /app

# Variables de entorno optimizadas
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

USER carsimulcast

EXPOSE 3000

CMD ["npm", "start"]
