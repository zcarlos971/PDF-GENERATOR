# Dockerfile que evita problemas de GPG y repositorios
FROM ghcr.io/puppeteer/puppeteer:21.0.0

# Cambiar a root temporalmente
USER root

# Solo instalar dependencias adicionales mínimas
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /usr/src/app

# Copiar package.json
COPY package.json ./

# Instalar dependencias (puppeteer ya está incluido en la imagen)
RUN npm ci --omit=dev --no-audit --no-fund

# Copiar código
COPY . .

# Variables de entorno
ENV NODE_ENV=production

# Cambiar a usuario no-root (ya existe en la imagen)
USER pptruser

EXPOSE 3000

CMD ["node", "server.js"]
