@echo off
chcp 65001 > nul
color 0B
echo ===================================================
echo       MISE A JOUR DU SYSTEME GAPRC (KIOSQUE)
echo ===================================================
echo.

echo 1. Telechargement des dernieres modifications depuis GitHub...
git pull origin main
IF %ERRORLEVEL% NEQ 0 (
	color 0C
	echo [ERREUR] Echec du telechargement ! Verifiez la connexion Internet.
	pause
	exit /b %ERRORLEVEL%
)

echo.
echo 2. Recompilation et demarrage des serveurs (Docker)...
docker compose up -d --build
IF %ERRORLEVEL% NEQ 0 (
	color 0C
	echo [ERREUR] Echec de Docker ! Docker Desktop est-il lance ?
	pause
	exit /b %ERRORLEVEL%
)

echo.
echo 3. Nettoyage des anciens fichiers inutiles...
docker image prune -f
echo.
color 0A
echo ===================================================
echo  MISE A JOUR TERMINEE AVEC SUCCES !
echo ===================================================
pause
