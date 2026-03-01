# GAPRC - Gestion Automatisée des Présences et Réconciliation de Caisse

Projet de TFE pour le Hall omnisports de Grez-Doiceau.

## État du projet : Phase 1 (Prototype Alpha)
Le projet est actuellement en phase de validation matérielle (Proof of Concept). 
Le matériel communique, identifie les badges et transmet les données via Wi-Fi.

## Stack technique
- **Microcontrôleur :** ESP32 (DevKit V1)
- **Langage :** C++ (Framework Arduino via PlatformIO)
- **Identification :** NFC (Lecteur PN532)
- **Communication :** Bus I2C, Wi-Fi (HTTP POST JSON)

## Structure du repository
- `/firmware` : Code source de l'ESP32.
- `/docs` : Schémas de câblage et journal de bord.
