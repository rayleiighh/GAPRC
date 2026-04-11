# gaprc-frontend/Dockerfile

# ÉTAPE 1 : Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Compile le code React/Vite (crée le dossier /dist)
RUN npm run build

# ÉTAPE 2 : Serveur Web
FROM nginx:alpine
# On copie le code compilé depuis l'étape 1
COPY --from=builder /app/dist /usr/share/nginx/html
# On ajoute notre configuration réseau
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]