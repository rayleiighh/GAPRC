@echo off
chcp 65001 > nul
color 0B
echo ===================================================
echo       MISE A JOUR DU SYSTEME GAPRC (KIOSQUE)
echo ===================================================
echo.
echo 1. Telechargement des dernieres modifications depuis GitHub...
git pull origin main
echo.
echo 2. Recompilation et demarrage des serveurs (Docker)...
docker compose up -d --build
echo.
echo 3. Nettoyage des anciens fichiers inutiles...
docker image prune -f
echo.
echo ===================================================
echo  MISE A JOUR TERMINEE ! Vous pouvez fermer cette fenetre.
echo ===================================================
pause
