# Imagen base con Node.js
FROM node:18-slim

# Instala dependencias necesarias para que Puppeteer funcione
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
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Crea directorio de trabajo
WORKDIR /app

# Copia los archivos del proyecto
COPY package*.json ./
RUN npm install
COPY . .

# Expone el puerto que usa tu app
EXPOSE 3000

# Comando para arrancar el servidor
CMD ["npm", "start"]
