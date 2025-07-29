# Usar Ubuntu LTS como base (más estable)
FROM ubuntu:22.04

# Evitar prompts interactivos
ENV DEBIAN_FRONTEND=noninteractive

# Instalar Node.js y dependencias básicas
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    apt-transport-https \
    software-properties-common

# Instalar Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Instalar Chrome
RUN curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable

# Instalar dependencias adicionales
RUN apt-get install -y \
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
    && rm -rf /var/lib/apt/lists/*

# Crear usuario
RUN groupadd -r nodeuser && useradd -r -g nodeuser -G audio,video nodeuser \
    && mkdir -p /home/nodeuser/Downloads \
    && chown -R nodeuser:nodeuser /home/nodeuser

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias de Node
RUN npm install --production

# Copiar aplicación
COPY . .

# Cambiar permisos
RUN chown -R nodeuser:nodeuser /app

# Cambiar a usuario no-root
USER nodeuser

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
