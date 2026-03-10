# Journal de Bord - TFE GAPRC

## Choix Techniques et Architecture
* **POC validé le [10/03/2026]** : Choix de maintenir l'ESP32 branché en USB pour l'alimentation, mais de conserver la communication Wi-Fi/HTTPS pour valider les compétences réseau.
* **Base de données** : Choix de PostgreSQL conteneurisé via Docker pour un environnement de développement propre et reproductible.

## Journal des erreurs et solutions
* *(On notera ici les futurs bugs Docker ou Node.js)*

## Mise en place de la Base de Données (Issue 1)
* **Technologie :** PostgreSQL 15 (version Alpine pour la légèreté).
* **Outil :** Docker & Docker Compose.
* **Pourquoi ?** Permet de conteneuriser la base de données sans polluer l'OS hôte, garantit que l'environnement de développement sera exactement le même que l'environnement de production. Les données sont persistées via un volume Docker (`pgdata`).

## Outils de développement et d'administration
* **Gestionnaire de Base de Données :** Extension VS Code "Database Client" (par cweijan).
* **Pourquoi ce choix ?** Pour centraliser l'environnement de développement. Garder l'éditeur de code, le terminal Docker et l'interface de la base de données au sein du même logiciel (VS Code) réduit la charge cognitive et évite de multiplier les logiciels tiers lourds (comme pgAdmin), répondant ainsi au besoin d'un flux de travail "propre et minimaliste".

## Sécurité et Configuration (Issue 1)
* **Gestion des secrets :** Utilisation d'un fichier `.env` pour injecter les variables d'environnement (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) dans le conteneur Docker.
* **Bonne pratique :** Le fichier `.env` a été explicitement ajouté au `.gitignore` pour éviter toute fuite de mots de passe sur le dépôt GitHub public/privé, respectant ainsi les normes de sécurité de base.