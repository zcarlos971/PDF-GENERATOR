# Usar la imagen oficial de Puppeteer (más confiable)
FROM ghcr.io/puppeteer/puppeteer:21.0.0

# El usuario pptruser ya existe en esta imagen
USER root

# Instalar dependencias adicionales si es necesario
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Cambiar al directorio de trabajo
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json
COPY --chown=pptruser:pptruser package*.json ./

# Cambiar a usuario pptruser para instalar
USER pptruser

# Instalar dependencias
RUN npm ci --omit=dev

# Copiar código fuente
COPY --chown=pptruser:pptruser . .

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "server.js"]
