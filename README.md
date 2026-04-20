# GAPRC - Système de gestion des présences et de réconciliation de caisse avec persistance hors ligne ( Anciennement : Gestion Automatisée du Pointage et Réconciliation de Caisse)
**TFE 2025-2026 - EPHEC**

![CI Pipeline](https://github.com/rayleiighh/GAPRC/actions/workflows/ci.yml/badge.svg)

<img width="225" height="225" alt="image" src="https://github.com/user-attachments/assets/691853c2-3f97-43ea-8f1c-2eb58d3885c1" />


## Présentation
Ce projet vise à automatiser le suivi des prestations et la gestion financière du Hall Omnisports de Grez-Doiceau via une solution IoT (Badgeuse ESP32) et une application Web (PWA).

## État d'avancement
- [x] Phase 1 : Validation matérielle (NFC + OLED + WiFi)
- [x] Phase 2 : Développement du Backend (Node.js) et de la Base de données (PostgreSQL)
- [x] Phase 3 : Développement de la PWA (Offline-First)
- [ ] Phase 4 : Déploiement et Mise en boîte

## Stack Technique
- **Matériel :** ESP32, PN532 (NFC), SSD1306 (OLED)
- **Langages :** C++ (Firmware), JavaScript (Node.js/React)
- **Protocoles :** I2C, HTTP/HTTPS, JSON

## Runbook On-Premise (Production Locale)

### 1) Déploiement / Mise à jour
```powershell
git pull origin main
docker compose up -d --build
docker compose ps
```

### 2) Vérification post-déploiement
```powershell
docker logs gaprc-backend-1 --tail 100
docker logs gaprc-frontend-1 --tail 100
docker logs gaprc-db-1 --tail 100
```

### 3) Backup manuel immédiat (avant intervention)
```powershell
docker exec gaprc-db-1 pg_dump -U gaprc_admin gaprc_db > backup-before-change.sql
```

### 4) Restauration (si incident)
```powershell
Get-Content .\backup-before-change.sql | docker exec -i gaprc-db-1 psql -U gaprc_admin -d gaprc_db
```

### 5) Rollback applicatif rapide
```powershell
git checkout <commit_stable>
docker compose up -d --build
```

### 6) Checklist recette (go/no-go)
- [ ] `/dashboard` redirige immédiatement vers `/admin/login` sans token.
- [ ] Clôture refusée si `shift_id` invalide côté kiosque.
- [ ] Changement de mot de passe directeur fonctionnel (ancien invalide / nouveau valide).
- [ ] Log d'audit `CHANGE_PASSWORD` visible dans Paramètres.
- [ ] `docker compose ps` montre tous les services en `Up`.
