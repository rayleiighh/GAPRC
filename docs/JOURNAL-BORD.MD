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

## Outils de développement et d'administration (Issue 1)
* **Gestionnaire de Base de Données :** Extension VS Code "Database Client" (par cweijan).
* **Pourquoi ce choix ?** Pour centraliser l'environnement de développement. Garder l'éditeur de code, le terminal Docker et l'interface de la base de données au sein du même logiciel (VS Code) réduit la charge cognitive et évite de multiplier les logiciels tiers lourds (comme pgAdmin), répondant ainsi au besoin d'un flux de travail "propre et minimaliste".

## Sécurité et Configuration (Issue 1)
* **Gestion des secrets :** Utilisation d'un fichier `.env` pour injecter les variables d'environnement (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) dans le conteneur Docker.
* **Bonne pratique :** Le fichier `.env` a été explicitement ajouté au `.gitignore` pour éviter toute fuite de mots de passe sur le dépôt GitHub public/privé, respectant ainsi les normes de sécurité de base.

## Modélisation de la Base de Données (Issue 2)
* **Architecture SQL :** Création des tables `users`, `badges`, `shifts` et `cash_reports`.
* **Relations et Intégrité :** * Implémentation d'une relation `1-1` stricte entre `shifts` et `cash_reports` (contrainte `UNIQUE` sur `shift_id`) pour éviter les doubles encodages de caisse.
  * Ajout du système `ON DELETE CASCADE` pour assurer la propreté de la base de données (la suppression d'un jobiste supprime son badge et son historique de shift).
  * Les identifiants matériels NFC (`nfc_uid`) sont protégés par une contrainte `UNIQUE`.
* **Automatisation :** Utilisation du point de montage `/docker-entrypoint-initdb.d` dans le `docker-compose.yml` pour exécuter le DDL (`01-schema.sql`) automatiquement à la création du conteneur.

* **Seeding :** Mise en place d'un script `02-seed.sql` pour automatiser l'injection d'un jeu de données de test (mock data) garantissant un environnement de développement prêt à l'emploi (Directeur, Jobiste, et historique de shift) lors de la construction du conteneur.

## **Seeding (Issue 3) :** Création du script `02-seed.sql` répondant aux CA stricts :
  * Ajout d'une colonne `email` et `password_hash` dans le schéma pour supporter l'authentification.
  * Injection d'un compte admin avec un mot de passe hashé en bcrypt (`Admin123!`).
  * Injection de 2 jobistes reliés à des UID réels de lecteur NFC.
  * Injection de 2 shifts historiques et de 2 rapports de caisse (dont un avec un écart pour les tests d'affichage).
  * Sécurisation du script avec `ON CONFLICT DO NOTHING` pour la réentrance (idempotence).

## Serveur Backend API (Issue 1)
* **Initialisation :** Mise en place d'un serveur Node.js avec Express.js.
* **Architecture :** Séparation des responsabilités préparée (`/routes`, `/controllers`, `/config`).
* **Sécurité & Réseau :** * Implémentation du middleware `cors` pour autoriser les requêtes cross-origin de la future PWA.
  * Variables d'environnement gérées via `dotenv`.
* **Base de données :** Connexion au conteneur PostgreSQL établie via un Pool de connexion (`pg`), optimisant ainsi la gestion des requêtes simultanées.
* **Monitoring :** Création d'une route `GET /api/health` validant la communication de bout en bout entre l'API et la BDD.

## Logique Métier : Pointage NFC (Issue 2)
* **Architecture MVC :** Création du contrôleur `scanController.js` et du routeur `scanRoutes.js` pour traiter les requêtes POST provenant de l'ESP32.
* **Sécurité SQL :** Utilisation systématique de requêtes paramétrées (`$1`) via le package `pg` pour se prémunir contre les injections SQL (mesure de sécurité critique pour le TFE).
* **Logique Check-in / Check-out :** * Si un scan est reçu avec un UID valide : le système vérifie si un `shift` est en cours (`end_time IS NULL`).
  * Si oui, il clôture le shift (UPDATE `end_time`).
  * Si non, il ouvre un nouveau shift (INSERT avec `start_time`).
* **Gestion d'erreurs :** Implémentation du code HTTP `404 Not Found` en cas d'UID inconnu ou inactif.

## Frontend : UX/UI et Maquettage
* **Outil utilisé :** Figma (avec assistance IA pour la génération des composants de base).
* **Approche Ergonomique :** * Design "Tablet/Desktop-First" pour les écrans de caisse et de veille, prévus pour être affichés en mode Kiosque sur l'ordinateur du bureau.
  * Utilisation de larges zones de clic (gros boutons, gros champs de texte) pour faciliter la saisie tactile et éviter les erreurs de frappe (robustesse à l'erreur utilisateur).
  * Application d'une charte graphique minimaliste (Rouge/Noir/Blanc) aux couleurs du Hall Omnisports.
  * Mise en évidence visuelle (badges rouges) des écarts de caisse négatifs sur le Dashboard Directeur pour une supervision rapide.
  