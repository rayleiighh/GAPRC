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
  

  ## Pivot Architectural : Ajout de `shift_transactions` (Issue #29)

**Objectif :** Permettre le calcul automatisé de la caisse théorique pour répondre au besoin de "Réconciliation de caisse".

**Analyse & Décision technique :**
Initialement, la caisse n'était qu'un total à la fin d'un shift. Pour garantir une double vérification comptable (Cash vs Carte) fiable, une table `shift_transactions` a été ajoutée. 
- **Relation :** N-1 avec la table `shifts` (`ON DELETE CASCADE` pour éviter les données orphelines si un shift est annulé/supprimé).
- **Données récoltées :** Nom du client, sport pratiqué, durée de location, et séparation stricte des paiements (`amount_cash` et `amount_card`).
- **Impact TFE :** Cette granularité permet de générer des "Cash Reports" précis pour le directeur du Hall Omnisport et facilite la vérification en fin de journée pour le jobiste.

## Implémentation API : Clôture de caisse & Idempotence (Issue 8)

**Réalisation :** Route `POST /api/reports` opérationnelle. La logique métier inclut désormais un calcul automatique de la caisse théorique (`expected_amount`) en interrogeant les données générées par la table `shift_transactions` (Issue 29).

**Résilience Offline (Background Sync) :**
Pour prévenir les "bursts" de requêtes lors de la restauration du Wi-Fi du Hall Omnisport, la route intercepte l'erreur PostgreSQL `23505` (violation de la contrainte d'unicité sur `shift_id`). L'API renvoie alors un `HTTP 200` silencieux, permettant au Service Worker de la PWA de purger sa file d'attente IndexedDB sans crasher ni fausser la comptabilité.

## Implémentation API : Saisie de caisse Offline-First (Issue 4 - API)

**Réalisation :** Création du contrôleur `addTransaction` (POST `/api/transactions`).

**Gestion du mode Hors-ligne (Idempotence) :**
L'API a été conçue pour supporter les envois différés de la PWA. Lorsqu'une requête arrive, le backend vérifie la présence du champ `local_id`. Si ce dernier existe déjà en base, l'API renvoie un statut `200 OK` sans recréer la ressource. Cela permet à l'interface client de vider son tampon IndexedDB sans risque de facturer le client en double lors des reconnexions réseau instables du hall.

## Implémentation API : Clôture de caisse & Transactions ACID (Issue 8 & 4)

**Objectif :** Permettre aux jobistes de clôturer leur shift en envoyant simultanément les transactions de la journée et les montants réels de la caisse. L'API doit calculer l'écart automatiquement et résister aux coupures réseau du Hall Omnisport.

**Réalisation & Choix Techniques :**
- Création des routes `POST /api/transactions` et `POST /api/shifts/close`.
- **Intégrité des données (ACID) :** L'insertion des transactions (`shift_transactions`), la génération du rapport (`cash_reports`) et la fermeture du shift (`shifts`) sont englobées dans une transaction PostgreSQL (`BEGIN` / `COMMIT`). En cas d'erreur ou de coupure réseau en plein traitement, un `ROLLBACK` est déclenché, empêchant toute corruption de la base de données.
- **Sécurité et Anti-fraude :** Le backend calcule lui-même la caisse théorique (`expected_amount`) en bouclant sur les transactions reçues, ce qui empêche toute manipulation depuis le frontend.
- **Résilience (Offline-First) :** L'API gère le code d'erreur SQL `23505` (violation d'unicité) pour intercepter silencieusement les requêtes en rafale (Background Sync) envoyées par la PWA lorsque le Wi-Fi revient. L'API renvoie un statut HTTP 200 (Idempotence) pour permettre au Service Worker de purger sa file d'attente IndexedDB proprement.

## Sécurisation de l'API : Auth Admin & JWT (Issue 5)

**Objectif :** Protéger l'accès au tableau de bord des directeurs et sécuriser les données financières, conformément aux exigences RGPD du TFE.

**Réalisation :**
- Implémentation de la route `POST /api/admin/login` vérifiant l'email et le mot de passe (hashés via bcrypt) dans la base PostgreSQL.
- Génération d'un JSON Web Token (JWT) d'une validité de 8 heures, contenant uniquement l'ID et le rôle (Zero-Knowledge Architecture pour le mot de passe).
- Création du middleware `middlewares/auth.js` (verifyToken) chargé d'intercepter, valider et décoder le token `Bearer` pour protéger les routes d'administration.

## Initialisation du Frontend & Intégration Maquettes (Issue 1)

**Objectif :** Mettre en place l'environnement de développement React et intégrer les maquettes haute-fidélité exportées de Figma.

**Réalisation :**
- Initialisation d'un projet Vite 8 avec TypeScript.
- Configuration de **Tailwind CSS v4** (nouvelle architecture Engine) pour la gestion du design system.
- Intégration des composants UI (Lucide React, Framer Motion) pour une interface utilisateur fluide.
- Mise en place du routage avec `react-router` (`/`, `/checkout/:name`, `/dashboard`).
## Clôture de l'Issue 5 : Dashboard Administrateur & Authentification JWT

**Objectif :** Sécuriser l'accès aux données financières du Hall Omnisport et remplacer les maquettes statiques par les données réelles de la base de données PostgreSQL.

**Réalisations techniques :**
- **Sécurité (CA1, CA2, CA4) :** - Création de la page `/admin/login`.
  - Implémentation de la protection de route côté React : vérification de la présence d'un token JWT valide dans le `localStorage` avant d'afficher le tableau de bord.
  - Fonctionnalité de déconnexion sécurisée (suppression des traces locales et redirection).
- **Intégration API (CA3) :** - Mise en place du `fetch` authentifié dans le Dashboard, injectant le token JWT dans le header `Authorization: Bearer <token>`.
  - Création de la route `GET /api/shifts` côté Node.js avec jointure SQL (`JOIN`) entre les tables `shifts`, `users` et `cash_reports` pour extraire les totaux financiers.
- **Traitement des données et UI (CA5) :**
  - Remplacement complet des "Mock Data" (données factices Figma) par le State dynamique React (`useState`, `useEffect`).
  - Résolution des conflits de typage entre PostgreSQL (qui renvoie les `NUMERIC` en `String` pour éviter les pertes de précision) et JavaScript via un parsage strict en `Number()`.
  - Création d'un algorithme de génération dynamique d'avatars (`getJobisteMeta`) pour gérer les nouveaux utilisateurs ajoutés via la base de données, rendant les onglets "Calendrier" et "Jobistes" 100% dynamiques.

**Statut :** Validé et fusionné (Resolves #22).

## Clôture des Issues #19 (WebSocket), #20 (Transactions) et #21 (Offline-First)

**Objectif :** Finaliser la boucle complète de l'application : du scan du badge matériel jusqu'à la sauvegarde en base de données, tout en garantissant une résilience totale aux pannes de réseau (Architecture PWA).

**Réalisations techniques :**
- **Déverrouillage Kiosque & Temps Réel (Issue 2) :** - Intégration de `socket.io` (Backend) et `socket.io-client` (Frontend).
  - Création du contrôleur `processNfcScan` qui intercepte le scan du badge (simulé via requêtes HTTP), crée le shift en DB, et émet un événement `unlock_session`.
  - Le frontend écoute cet événement et navigue dynamiquement vers l'interface de caisse du jobiste concerné.
  
- **PWA & Résilience Réseau - Offline-First (Issue 4) :**
  - Implémentation d'une base de données locale dans le navigateur via `Dexie.js` (IndexedDB).
  - Gestion du flux d'enregistrement de secours : en cas de coupure réseau (détection via `navigator.onLine` ou échec du `fetch`), les transactions sont stockées localement.
  - Création d'un écouteur d'événement (`window.addEventListener('online')`) pour la synchronisation automatique en arrière-plan au retour d'internet.

- **Finalisation du Shift (Issue 3) :**
  - Envoi effectif de la clôture de caisse avec le calcul des écarts vers PostgreSQL.

**Décision d'Architecture & UX :**
- **Abandon justifié du CA4 (Issue #19) :** Le critère demandant un reverrouillage automatique après X minutes d'inactivité a été consciemment écarté.
  *Justification :* L'application Kiosque a pour but de rester ouverte tout au long du shift pour permettre l'encodage des clients au fil de l'eau. Un reverrouillage intempestif forcerait le jobiste à re-badger constamment, causant une mauvaise UX et risquant de provoquer des pertes d'état (state React) dans le formulaire en cours de remplissage, voire des clôtures asynchrones.

**Difficultés rencontrées & Résolutions :**
1. **Conflit de typage SQL (`22P02`) :** Incompatibilité entre l'input libre de durée (ex: "1h30") et le type `INTEGER` de la DB. Résolu en altérant la table vers `VARCHAR`.
2. **Gestion des Timezones (Décalage de 2h) :** L'envoi de la date via `toISOString()` cumulé à la conversion `AT TIME ZONE` de PostgreSQL faussait l'heure d'enregistrement. Résolu en formatant la date localement en JS (format pur `YYYY-MM-DD HH:mm:ss`) et en retirant les sur-conversions de la requête SQL.

**Statut :** Issues #19, #20 et #21 validées et fermées. Boucle de caisse 100% opérationnelle.

## Clôture de l'Issue #6 : [PWA] Gestion des Jobistes & Assignation des Badges RFID

**Objectif :** Rendre l'administration de l'application 100% autonome en permettant au directeur de gérer son équipe (CRUD) et de lier les badges matériels (NFC) directement depuis le tableau de bord sécurisé.

**Réalisations techniques :**

**1. Backend (API & Sécurité) :**
- Création des routes RESTful dans `/routes/adminRoutes.js` (`GET`, `POST`, `DELETE`).
- Sécurisation stricte des routes d'administration via le middleware `verifyToken` (JWT) pour empêcher toute manipulation externe.
- Implémentation du contrôleur `adminController.js` :
  - `getAllJobistes` : Jointure SQL (`LEFT JOIN`) entre les tables `users` et `badges` pour remonter l'état de l'accès matériel de chaque jobiste.
  - `addJobiste` : Insertion sécurisée avec gestion des conflits (erreur 409 si l'email existe déjà).
  - `assignBadge` : Logique transactionnelle (`BEGIN/COMMIT`) remplaçant l'ancien badge par le nouveau de manière atomique, avec gestion de la contrainte d'unicité de l'UID NFC.
  - `deleteJobiste` : Suppression propre en cascade (le `ON DELETE CASCADE` de PostgreSQL s'occupant de nettoyer le badge et l'historique associés).

**2. Frontend (React / Interface Directeur) :**
- Refonte complète de l'onglet "Jobistes" dans `DirectorDashboard.tsx` pour passer de données statiques (Mocks) à un affichage dynamique (`fetch` API).
- Création de `AddJobisteModal` : Formulaire contrôlé pour la création de profil.
- Création de `AssignBadgeModal` : Interface d'appairage matériel (prête à recevoir un input manuel ou le scan direct d'un lecteur RFID USB clavier).
- Gestion des états de chargement, rafraîchissement automatique de la liste après une action, et gestion des erreurs de saisie renvoyées par le backend.

**Statut :** Issue #6 validée et fermée. Le Dashboard Admin est désormais totalement interconnecté avec le backend métier et matériel.

## Clôture de l'Issue #7 : [PWA] Installation Native & Résilience Globale (Offline-First)

**Objectif :** Transformer l'application web en un logiciel installable (Progressive Web App) pour le Kiosque, et garantir que la synchronisation des caisses hors-ligne se fasse de manière globale et transparente.

**Réalisations techniques :**

**1. Configuration PWA (Vite & Manifest) :**
- Intégration de `vite-plugin-pwa` pour la génération automatique du Service Worker (`sw.js`).
- Configuration stricte du `manifest.webmanifest` (icônes `maskable` et `any` en 192x192 et 512x512, mode `standalone` pour masquer l'UI du navigateur Chrome).
- Ajout d'une modale `ReloadPrompt` permettant de notifier l'utilisateur lors du déploiement d'une nouvelle version de l'application.

**2. Refactoring de la Synchronisation (IndexedDB) :**
- Découverte d'un bug d'architecture : l'écouteur `window.addEventListener('online')` était circonscrit à la page de caisse, empêchant la synchronisation si le réseau revenait sur l'écran de veille.
- Résolution : Extraction de la logique de synchronisation (lecture de `Dexie.js` et requêtes `POST /api/shifts/close`) vers le point d'entrée global de l'application (`App.tsx`).
- Résultat : La boucle de résilience est désormais parfaite. Les données sont sauvegardées localement en cas de coupure, et dépilées silencieusement en arrière-plan dès le retour du réseau, peu importe l'écran actif.

**Statut :** Issue #7 validée. L'application est installable et 100% tolérante aux pannes réseau.

## Clôture de l'Issue #8 : [PWA] Exports Comptables (CSV & PDF)

**Objectif :** Permettre à la direction et à la comptabilité d'exporter facilement les données financières des shifts validés.

**Réalisations techniques :**
- **Exports CSV :** Création d'un script natif générant un fichier `.csv` (format Excel) à partir des données JSON, utilisant un `Blob` et une balise `<a>` dynamique pour forcer le téléchargement.
- **Exports PDF :** Intégration des librairies `jspdf` et `jspdf-autotable` pour générer un rapport PDF stylisé côté client (sans surcharger le backend).
- **Liaison Dynamique (React) :** Les exports sont connectés au filtre global du Dashboard (`filteredShifts`). Le fichier exporté correspond toujours exactement à la vue active (ex: un jour précis ou l'historique complet).
- **Persistance des paramètres :** Utilisation du `localStorage` pour sauvegarder les informations du centre (Nom, Adresse, Email) et injection dynamique de ces données dans l'en-tête du document PDF généré.

**Statut :** Issue #8 validée. Les outils comptables sont 100% opérationnels.

## Clôture de l'Issue #9 : [PWA] Variables d'environnement & Refactoring

**Objectif :** Préparer l'application pour le déploiement en production en dynamisant les appels API, et assainir la base de code en découpant les composants trop volumineux ("God Components").

**Réalisations techniques :**
- **Variables d'Environnement :** Création du fichier `.env` global et remplacement de toutes les URLs backend codées en dur (`http://localhost:3000`) par la variable Vite `import.meta.env.VITE_API_URL` à travers toute l'application.
- **Refactoring du Dashboard (`DirectorDashboard.tsx`) :** Extraction de la logique des paramètres (`SettingsTab`) et de la gestion RH/Modales (`JobistesTab`) vers de nouveaux composants isolés dans `src/components/dashboard/`. Le fichier principal a été allégé de plus de 50%.
- **Refactoring de la Caisse (`JobisteCheckoutForm.tsx`) :** Extraction des 3 modales complexes (`AddEntryModal`, `ChecklistModal`, `ClotureModal`) vers le dossier `src/components/checkout/`.
- **Fix TypeScript (Build) :** Résolution des erreurs de compilation Vite/Rollup liées à l'import d'interfaces (`Entry`, `ChecklistItem`) en utilisant explicitement la syntaxe `import type`, garantissant un bundle JavaScript final propre.

**Statut :** Issue #9 validée. La dette technique est remboursée, le code est désormais modulaire, maintenable et prêt pour les environnements de production.