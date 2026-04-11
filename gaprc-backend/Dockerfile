# gaprc-backend/Dockerfile
FROM node:18-alpine

# Créer le dossier de l'app
WORKDIR /app

# Copier uniquement les fichiers de dépendances d'abord (Optimisation du cache Docker)
COPY package*.json ./

# Installer uniquement les dépendances de production (sans Jest, etc.)
RUN npm install --omit=dev

# Copier le reste du code
COPY . .

# Exposer le port de l'API
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]