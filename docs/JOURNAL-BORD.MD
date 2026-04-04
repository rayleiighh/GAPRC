# Journal de Bord - TFE GAPRC

## Choix Techniques et Architecture
* **POC validé le [10/03/2026]** : Choix de maintenir l'ESP32 branché en USB pour l'alimentation, mais de conserver la communication Wi-Fi/HTTPS pour valider les compétences réseau.
* **Base de données** : Choix de PostgreSQL conteneurisé via Docker pour un environnement de développement propre et reproductible.

## Journal des erreurs et solutions
* *(On notera ici les futurs bugs Docker ou Node.js)*

## 🟢 MUST-1 [DB] Environnement PostgreSQL Docker — Fondation du système
* **Technologie :** PostgreSQL 15 (version Alpine pour la légèreté).
* **Outil :** Docker & Docker Compose.
* **Pourquoi ?** Permet de conteneuriser la base de données sans polluer l'OS hôte, garantit que l'environnement de développement sera exactement le même que l'environnement de production. Les données sont persistées via un volume Docker (`pgdata`).

## Outils de développement et d'administration (🟢 MUST-1)
* **Gestionnaire de Base de Données :** Extension VS Code "Database Client" (par cweijan).
* **Pourquoi ce choix ?** Pour centraliser l'environnement de développement. Garder l'éditeur de code, le terminal Docker et l'interface de la base de données au sein du même logiciel (VS Code) réduit la charge cognitive et évite de multiplier les logiciels tiers lourds (comme pgAdmin), répondant ainsi au besoin d'un flux de travail "propre et minimaliste".

## Sécurité et Configuration (🟢 MUST-1)
* **Gestion des secrets :** Utilisation d'un fichier `.env` pour injecter les variables d'environnement (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) dans le conteneur Docker.
* **Bonne pratique :** Le fichier `.env` a été explicitement ajouté au `.gitignore` pour éviter toute fuite de mots de passe sur le dépôt GitHub public/privé, respectant ainsi les normes de sécurité de base.

## 🟢 MUST-2 [DB] Schéma relationnel DDL — Intégrité des données shifts & caisses
* **Architecture SQL :** Création des tables `users`, `badges`, `shifts` et `cash_reports`.
* **Relations et Intégrité :**
  * Implémentation d'une relation `1-1` stricte entre `shifts` et `cash_reports` (contrainte `UNIQUE` sur `shift_id`) pour éviter les doubles encodages de caisse.
  * Ajout du système `ON DELETE CASCADE` pour assurer la propreté de la base de données (la suppression d'un jobiste supprime son badge et son historique de shift).
  * Les identifiants matériels NFC (`nfc_uid`) sont protégés par une contrainte `UNIQUE`.
* **Automatisation :** Utilisation du point de montage `/docker-entrypoint-initdb.d` dans le `docker-compose.yml` pour exécuter le DDL (`01-schema.sql`) automatiquement à la création du conteneur.

* **Seeding :** Mise en place d'un script `02-seed.sql` pour automatiser l'injection d'un jeu de données de test (mock data) garantissant un environnement de développement prêt à l'emploi (Directeur, Jobiste, et historique de shift) lors de la construction du conteneur.

## 🟡 SHOULD-1 [DB] Seeding — Jeu de données de test réalistes
  * Ajout d'une colonne `email` et `password_hash` dans le schéma pour supporter l'authentification.
  * Injection d'un compte admin avec un mot de passe hashé en bcrypt (`Admin123!`).
  * Injection de 2 jobistes reliés à des UID réels de lecteur NFC.
  * Injection de 2 shifts historiques et de 2 rapports de caisse (dont un avec un écart pour les tests d'affichage).
  * Sécurisation du script avec `ON CONFLICT DO NOTHING` pour la réentrance (idempotence).

## 🟢 MUST-3 [API] Backend Express + Connexion DB — Fondation de l'API
* **Initialisation :** Mise en place d'un serveur Node.js avec Express.js.
* **Architecture :** Séparation des responsabilités préparée (`/routes`, `/controllers`, `/config`).
* **Sécurité & Réseau :**
  * Implémentation du middleware `cors` pour autoriser les requêtes cross-origin de la future PWA.
  * Variables d'environnement gérées via `dotenv`.
* **Base de données :** Connexion au conteneur PostgreSQL établie via un Pool de connexion (`pg`), optimisant ainsi la gestion des requêtes simultanées.
* **Monitoring :** Création d'une route `GET /api/health` validant la communication de bout en bout entre l'API et la BDD.

## 🟢 MUST-4 [API] Pointage jobiste — POST /api/scan (NFC horodaté)
* **Architecture MVC :** Création du contrôleur `scanController.js` et du routeur `scanRoutes.js` pour traiter les requêtes POST provenant de l'ESP32.
* **Sécurité SQL :** Utilisation systématique de requêtes paramétrées (`$1`) via le package `pg` pour se prémunir contre les injections SQL (mesure de sécurité critique pour le TFE).
* **Logique Check-in / Check-out :**
  * Si un scan est reçu avec un UID valide : le système vérifie si un `shift` est en cours (`end_time IS NULL`).
  * Si oui, il clôture le shift (UPDATE `end_time`).
  * Si non, il ouvre un nouveau shift (INSERT avec `start_time`).
* **Gestion d'erreurs :** Implémentation du code HTTP `404 Not Found` en cas d'UID inconnu ou inactif.

## 🟢 MUST-5 [PWA] Maquettes UI/UX — Kiosque jobiste & Dashboard directeur
* **Outil utilisé :** Figma (avec assistance IA pour la génération des composants de base).
* **Approche Ergonomique :**
  * Design "Tablet/Desktop-First" pour les écrans de caisse et de veille, prévus pour être affichés en mode Kiosque sur l'ordinateur du bureau.
  * Utilisation de larges zones de clic (gros boutons, gros champs de texte) pour faciliter la saisie tactile et éviter les erreurs de frappe (robustesse à l'erreur utilisateur).
  * Application d'une charte graphique minimaliste (Rouge/Noir/Blanc) aux couleurs du Hall Omnisports.
  * Mise en évidence visuelle (badges rouges) des écarts de caisse négatifs sur le Dashboard Directeur pour une supervision rapide.

## 🟢 MUST-6 [DB] Table shift_transactions — Double vérification comptable

**Objectif :** Permettre le calcul automatisé de la caisse théorique pour répondre au besoin de "Réconciliation de caisse".

**Analyse & Décision technique :**
Initialement, la caisse n'était qu'un total à la fin d'un shift. Pour garantir une double vérification comptable (Cash vs Carte) fiable, une table `shift_transactions` a été ajoutée.
- **Relation :** N-1 avec la table `shifts` (`ON DELETE CASCADE` pour éviter les données orphelines si un shift est annulé/supprimé).
- **Données récoltées :** Nom du client, sport pratiqué, durée de location, et séparation stricte des paiements (`amount_cash` et `amount_card`).
- **Impact TFE :** Cette granularité permet de générer des "Cash Reports" précis pour le directeur du Hall Omnisport et facilite la vérification en fin de journée pour le jobiste.

## 🟡 SHOULD-2 [API] Saisie de caisse offline-compatible — POST /api/reports

**Réalisation :** Route `POST /api/reports` opérationnelle. La logique métier inclut désormais un calcul automatique de la caisse théorique (`expected_amount`) en interrogeant les données générées par la table `shift_transactions` (MUST-6 #29).

**Résilience Offline (Background Sync) :**
Pour prévenir les "bursts" de requêtes lors de la restauration du Wi-Fi du Hall Omnisport, la route intercepte l'erreur PostgreSQL `23505` (violation de la contrainte d'unicité sur `shift_id`). L'API renvoie alors un `HTTP 200` silencieux, permettant au Service Worker de la PWA de purger sa file d'attente IndexedDB sans crasher ni fausser la comptabilité.

## 🟡 SHOULD-8 [API] Clôture de caisse avec transactions — POST /api/shifts/close (ACID)

**Réalisation :** Création du contrôleur `addTransaction` (POST `/api/transactions`).

**Gestion du mode Hors-ligne (Idempotence) :**
L'API a été conçue pour supporter les envois différés de la PWA. Lorsqu'une requête arrive, le backend vérifie la présence du champ `local_id`. Si ce dernier existe déjà en base, l'API renvoie un statut `200 OK` sans recréer la ressource. Cela permet à l'interface client de vider son tampon IndexedDB sans risque de facturer le client en double lors des reconnexions réseau instables du hall.

**Objectif :** Permettre aux jobistes de clôturer leur shift en envoyant simultanément les transactions de la journée et les montants réels de la caisse. L'API doit calculer l'écart automatiquement et résister aux coupures réseau du Hall Omnisport.

**Réalisation & Choix Techniques :**
- Création des routes `POST /api/transactions` et `POST /api/shifts/close`.
- **Intégrité des données (ACID) :** L'insertion des transactions (`shift_transactions`), la génération du rapport (`cash_reports`) et la fermeture du shift (`shifts`) sont englobées dans une transaction PostgreSQL (`BEGIN` / `COMMIT`). En cas d'erreur ou de coupure réseau en plein traitement, un `ROLLBACK` est déclenché, empêchant toute corruption de la base de données.
- **Sécurité et Anti-fraude :** Le backend calcule lui-même la caisse théorique (`expected_amount`) en bouclant sur les transactions reçues, ce qui empêche toute manipulation depuis le frontend.
- **Résilience (Offline-First) :** L'API gère le code d'erreur SQL `23505` (violation d'unicité) pour intercepter silencieusement les requêtes en rafale (Background Sync) envoyées par la PWA lorsque le Wi-Fi revient. L'API renvoie un statut HTTP 200 (Idempotence) pour permettre au Service Worker de purger sa file d'attente IndexedDB proprement.

## 🟡 SHOULD-11 [API] Authentification Directeur — Login JWT & Middleware sécurisé

**Objectif :** Protéger l'accès au tableau de bord des directeurs et sécuriser les données financières, conformément aux exigences RGPD du TFE.

**Réalisation :**
- Implémentation de la route `POST /api/admin/login` vérifiant l'email et le mot de passe (hashés via bcrypt) dans la base PostgreSQL.
- Génération d'un JSON Web Token (JWT) d'une validité de 8 heures, contenant uniquement l'ID et le rôle (Zero-Knowledge Architecture pour le mot de passe).
- Création du middleware `middlewares/auth.js` (verifyToken) chargé d'intercepter, valider et décoder le token `Bearer` pour protéger les routes d'administration.

## 🟡 SHOULD-3 [PWA] Initialisation React + Routage — Kiosque & Espace Directeur

**Objectif :** Mettre en place l'environnement de développement React et intégrer les maquettes haute-fidélité exportées de Figma.

**Réalisation :**
- Initialisation d'un projet Vite 8 avec TypeScript.
- Configuration de **Tailwind CSS v4** (nouvelle architecture Engine) pour la gestion du design system.
- Intégration des composants UI (Lucide React, Framer Motion) pour une interface utilisateur fluide.
- Mise en place du routage avec `react-router` (`/`, `/checkout/:name`, `/dashboard`).

## 🟡 SHOULD-7 [PWA] Dashboard Directeur sécurisé — Auth JWT & Supervision shifts

**Objectif :** Sécuriser l'accès aux données financières du Hall Omnisport et remplacer les maquettes statiques par les données réelles de la base de données PostgreSQL.

**Réalisations techniques :**
- **Sécurité (CA1, CA2, CA4) :**
  - Création de la page `/admin/login`.
  - Implémentation de la protection de route côté React : vérification de la présence d'un token JWT valide dans le `localStorage` avant d'afficher le tableau de bord.
  - Fonctionnalité de déconnexion sécurisée (suppression des traces locales et redirection).
- **Intégration API (CA3) :**
  - Mise en place du `fetch` authentifié dans le Dashboard, injectant le token JWT dans le header `Authorization: Bearer <token>`.
  - Création de la route `GET /api/shifts` côté Node.js avec jointure SQL (`JOIN`) entre les tables `shifts`, `users` et `cash_reports` pour extraire les totaux financiers.
- **Traitement des données et UI (CA5) :**
  - Remplacement complet des "Mock Data" (données factices Figma) par le State dynamique React (`useState`, `useEffect`).
  - Résolution des conflits de typage entre PostgreSQL (qui renvoie les `NUMERIC` en `String` pour éviter les pertes de précision) et JavaScript via un parsage strict en `Number()`.
  - Création d'un algorithme de génération dynamique d'avatars (`getJobisteMeta`) pour gérer les nouveaux utilisateurs ajoutés via la base de données, rendant les onglets "Calendrier" et "Jobistes" 100% dynamiques.

**Statut :** Validé et fusionné (Resolves #22).

## Clôture des Issues 🟡 SHOULD-4, 🟡 SHOULD-5 et 🟡 SHOULD-6

**Objectif :** Finaliser la boucle complète de l'application : du scan du badge matériel jusqu'à la sauvegarde en base de données, tout en garantissant une résilience totale aux pannes de réseau (Architecture PWA).

**Réalisations techniques :**
- **🟡 SHOULD-4 [PWA] Interface Kiosque — Déverrouillage automatique WebSocket :**
  - Intégration de `socket.io` (Backend) et `socket.io-client` (Frontend).
  - Création du contrôleur `processNfcScan` qui intercepte le scan du badge (simulé via requêtes HTTP), crée le shift en DB, et émet un événement `unlock_session`.
  - Le frontend écoute cet événement et navigue dynamiquement vers l'interface de caisse du jobiste concerné.

- **🟡 SHOULD-6 [PWA] Résilience réseau — Offline-First & IndexedDB :**
  - Implémentation d'une base de données locale dans le navigateur via `Dexie.js` (IndexedDB).
  - Gestion du flux d'enregistrement de secours : en cas de coupure réseau (détection via `navigator.onLine` ou échec du `fetch`), les transactions sont stockées localement.
  - Création d'un écouteur d'événement (`window.addEventListener('online')`) pour la synchronisation automatique en arrière-plan au retour d'internet.

- **🟡 SHOULD-5 [PWA] Formulaire clôture de caisse — Saisie ergonomique jobiste :**
  - Envoi effectif de la clôture de caisse avec le calcul des écarts vers PostgreSQL.

**Décision d'Architecture & UX :**
- **Abandon justifié du CA4 (SHOULD-4 #19) :** Le critère demandant un reverrouillage automatique après X minutes d'inactivité a été consciemment écarté.
  *Justification :* L'application Kiosque a pour but de rester ouverte tout au long du shift pour permettre l'encodage des clients au fil de l'eau. Un reverrouillage intempestif forcerait le jobiste à re-badger constamment, causant une mauvaise UX et risquant de provoquer des pertes d'état (state React) dans le formulaire en cours de remplissage, voire des clôtures asynchrones.

**Difficultés rencontrées & Résolutions :**
1. **Conflit de typage SQL (`22P02`) :** Incompatibilité entre l'input libre de durée (ex: "1h30") et le type `INTEGER` de la DB. Résolu en altérant la table vers `VARCHAR`.
2. **Gestion des Timezones (Décalage de 2h) :** L'envoi de la date via `toISOString()` cumulé à la conversion `AT TIME ZONE` de PostgreSQL faussait l'heure d'enregistrement. Résolu en formatant la date localement en JS (format pur `YYYY-MM-DD HH:mm:ss`) et en retirant les sur-conversions de la requête SQL.

**Statut :** Issues SHOULD-4 (#19), SHOULD-5 (#20) et SHOULD-6 (#21) validées et fermées. Boucle de caisse 100% opérationnelle.

## 🟡 SHOULD-12 [PWA] Gestion équipe jobistes & Assignation badges NFC

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

**Statut :** SHOULD-12 (#31) validée et fermée. Le Dashboard Admin est désormais totalement interconnecté avec le backend métier et matériel.

## 🟡 SHOULD-9 [PWA] Installation & Service Worker — App installable Offline-First

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

**Statut :** SHOULD-9 (#32) validée. L'application est installable et 100% tolérante aux pannes réseau.

## 🔵 COULD-8 [PWA] Exports comptables — Téléchargement CSV & PDF pour le directeur

**Objectif :** Permettre à la direction et à la comptabilité d'exporter facilement les données financières des shifts validés.

**Réalisations techniques :**
- **Exports CSV :** Création d'un script natif générant un fichier `.csv` (format Excel) à partir des données JSON, utilisant un `Blob` et une balise `<a>` dynamique pour forcer le téléchargement.
- **Exports PDF :** Intégration des librairies `jspdf` et `jspdf-autotable` pour générer un rapport PDF stylisé côté client (sans surcharger le backend).
- **Liaison Dynamique (React) :** Les exports sont connectés au filtre global du Dashboard (`filteredShifts`). Le fichier exporté correspond toujours exactement à la vue active (ex: un jour précis ou l'historique complet).
- **Persistance des paramètres :** Utilisation du `localStorage` pour sauvegarder les informations du centre (Nom, Adresse, Email) et injection dynamique de ces données dans l'en-tête du document PDF généré.

**Statut :** COULD-8 (#33) validée. Les outils comptables sont 100% opérationnels.

## 🔵 COULD-9 [PWA] Variables d'environnement & Refactoring — Préparation déploiement

**Objectif :** Préparer l'application pour le déploiement en production en dynamisant les appels API, et assainir la base de code en découpant les composants trop volumineux ("God Components").

**Réalisations techniques :**
- **Variables d'Environnement :** Création du fichier `.env` global et remplacement de toutes les URLs backend codées en dur (`http://localhost:3000`) par la variable Vite `import.meta.env.VITE_API_URL` à travers toute l'application.
- **Refactoring du Dashboard (`DirectorDashboard.tsx`) :** Extraction de la logique des paramètres (`SettingsTab`) et de la gestion RH/Modales (`JobistesTab`) vers de nouveaux composants isolés dans `src/components/dashboard/`. Le fichier principal a été allégé de plus de 50%.
- **Refactoring de la Caisse (`JobisteCheckoutForm.tsx`) :** Extraction des 3 modales complexes (`AddEntryModal`, `ChecklistModal`, `ClotureModal`) vers le dossier `src/components/checkout/`.
- **Fix TypeScript (Build) :** Résolution des erreurs de compilation Vite/Rollup liées à l'import d'interfaces (`Entry`, `ChecklistItem`) en utilisant explicitement la syntaxe `import type`, garantissant un bundle JavaScript final propre.

**Statut :** COULD-9 (#34) validée. La dette technique est remboursée, le code est désormais modulaire, maintenable et prêt pour les environnements de production.

## 🟡 SHOULD-14 [PWA] Synchronisation temps réel Dashboard — Événement shift_closed (WebSocket)

**Objectif :** Permettre au tableau de bord de la direction de s'actualiser en direct, sans action de l'utilisateur, dès qu'un shift est clôturé sur le Kiosque.

**Réalisations techniques :**
- **Backend (Node.js/Express) :** Utilisation d'un middleware pour injecter l'instance `Socket.io` (`req.io = io`) dans toutes les requêtes HTTP. Ajout de l'événement `req.io.emit("shift_closed")` à la fin de la transaction SQL de clôture de caisse (`shiftController.js`).
- **Frontend (React) :** Intégration de `socket.io-client` dans le composant `DirectorDashboard.tsx`. Création d'un écouteur WebSocket (`socket.on("shift_closed")`) qui déclenche silencieusement la fonction `fetchShifts()` en arrière-plan.
- **Résultat :** Une expérience utilisateur fluide et "Software-like". Les graphiques, les KPIs et les tableaux financiers se mettent à jour en temps réel à la seconde où un jobiste valide sa caisse à l'accueil du complexe sportif.

**Statut :** SHOULD-14 (#35) validée. Le système est désormais totalement réactif.

## 🔵 COULD-10 [PWA] Robustesse formulaire — Validation métier anti-fraude (durée vs shift)

**Objectif :** Améliorer la qualité et la fiabilité des données entrées par les jobistes lors de l'ajout d'un client, tout en respectant la réalité du terrain (cas d'usage métier).

**Réalisations techniques :**
- **Refactoring UI (`AddEntryModal.tsx`) :** Transformation du champ "Durée" (précédemment en texte libre) en un menu déroulant strict (`<select>`). Cela garantit que la base de données ne reçoit que des formats standardisés ("1h", "1h30", "2h", etc.), ce qui est indispensable pour la future génération de statistiques.
- **Ajustement des règles métiers :** Suite à une analyse d'utilisation réelle (les clients paient souvent *avant* de jouer), la restriction temporelle bloquante a été écartée. Un jobiste peut légitimement encaisser une session de 3h même s'il vient tout juste de commencer son shift.

**Statut :** COULD-10 (#36) validée. Les formulaires sont plus robustes et les données sont formatées proprement pour le Dashboard.

## 🟡 SHOULD-15 [PWA/API] Vue détaillée d'un shift — Audit transactions par le directeur

**Objectif :** Offrir à la direction un outil d'audit approfondi permettant de visualiser le détail exact de chaque caisse clôturée (liste des clients, sports pratiqués, durée, paiements, et commentaires éventuels du jobiste).

**Réalisations techniques :**
- **Base de données (`database/init`) :**
  - Mise à jour du fichier `01-schema.sql` : Ajout de la colonne `comment` (TEXT) dans la table `shifts`.
  - Modification du type de la colonne `duration` (de INT vers VARCHAR) dans la table `shift_transactions` pour correspondre au nouveau standard du Kiosque (COULD-10 #36).
  - Ajout de la contrainte `UNIQUE` sur `local_id` pour la sécurité hors-ligne (PWA).
  - Mise à jour des fausses données (`02-seed.sql`) pour refléter ces nouveaux formats.
- **Backend (Node.js) :**
  - Modification du contrôleur `closeShift` pour sauvegarder le commentaire en DB.
  - Création de la route `GET /api/shifts/:id/details` pour regrouper les infos du shift et ses transactions associées.
- **Frontend (React) :**
  - Création de la modale dynamique `ShiftDetailsModal.tsx`.
  - Rendu des lignes du tableau de bord (`DirectorDashboard.tsx`) interactives (cliquables) pour déclencher l'ouverture de la modale d'audit.

**Statut :** SHOULD-15 (#37) validée. Le dashboard offre désormais une traçabilité financière et opérationnelle totale.

## 🔵 COULD-11 [PWA] Sécurité navigation — Prévention perte de données (modale de sortie)

**Objectif :** Protéger le travail en cours des jobistes en empêchant la fermeture accidentelle de l'écran de caisse (ce qui entraînerait la perte des transactions non clôturées).

**Réalisations techniques :**
- **Composant UI (`ExitWarningModal.tsx`) :** Création d'une modale d'alerte spécifique avec une interface claire (icône de danger, boutons d'actions distincts).
- **Interception de la navigation (`JobisteCheckoutForm.tsx`) :** Modification du comportement du bouton "Retour" (`ChevronLeft`). Au lieu d'exécuter un `navigate("/")` immédiat, il déclenche désormais l'affichage de l'avertissement.
- **Redirection intelligente :** L'utilisateur a le choix de forcer la sortie (perte assumée), d'annuler son action, ou d'être redirigé directement vers l'écran de clôture pour sauvegarder son travail proprement.

**Statut :** COULD-11 (#38) validée. La caisse est sécurisée contre les erreurs de manipulation.

## 🟡 SHOULD-10 [API/DB] Unicité des shifts — Protection anti-conflit de badges

**Objectif :** Garantir l'intégrité de la base de données en s'assurant qu'une seule caisse (shift) est ouverte à la fois physiquement sur le terminal Kiosque, évitant ainsi les chevauchements de sessions.

**Réalisations techniques :**
- **Logique Serveur (`scanController.js`) :** Mise à jour majeure de la route d'authentification RFID (`processNfcScan`). Le serveur vérifie désormais globalement s'il existe un shift avec `end_time IS NULL`.
- **Gestion de la reprise de session (Resume) :** Si l'utilisateur qui badge est déjà le propriétaire du shift en cours, le serveur lui accorde l'accès (HTTP 200) sans recréer de shift, permettant une reprise fluide après une mise en veille ou une erreur de navigation.
- **Prévention des conflits (Concurrency) :** Si un utilisateur tente de badger alors qu'un shift appartient à un collègue, la requête est formellement rejetée (HTTP 403 Forbidden).
- **Préparation Hardware :** Le backend renvoie un payload d'erreur structuré (`{"error": "CAISSE_OCCUPEE", "message": "Caisse occupée par X"}`). L'ESP32 pourra parser ce JSON pour afficher l'alerte physiquement sur l'écran OLED.

**Statut :** SHOULD-10 (#39) validée. Le Kiosque gère parfaitement la concurrence matérielle et logicielle.



## 🟡 SHOULD-13 [API] WebSockets temps réel — Déverrouillage kiosque sans rafraîchissement

**Objectif :** Permettre au Kiosque React (PWA) de réagir en temps réel aux interactions matérielles (scan de badge sur l'ESP32) sans nécessiter de rafraîchissement de page (Polling).

**Réalisations techniques :**
- **Frontend (Kiosque) :** Utilisation de `socket.io-client` dans un `useEffect` au chargement de `KioskIdleScreen.tsx`.
- **Événement `unlock_session` :** Le composant écoute activement cet événement. Dès réception du payload (contenant le nom du jobiste et l'ID du shift ouvert), l'application :
  1. Enregistre le `shift_id` dans le `localStorage` de manière sécurisée.
  2. Déclenche une navigation programmatique (React Router `Maps()`) vers l'interface de caisse (`/checkout`).
- **Bénéfice UX :** Le jobiste n'a jamais besoin d'utiliser de souris ou de clavier pour initier son shift. Le simple contact physique de son badge sur le lecteur suffit à basculer l'écran.

**Statut :** Issue #13 validée. La boucle matérielle -> logicielle est 100% sans friction.

## 🔵 COULD-12 [API] Sécurité Anti-Brute Force — Rate Limiter sur l'authentification (#40)

**Objectif :** Protéger le panneau d'administration du Directeur contre les attaques par force brute ou par dictionnaire (tentatives de mots de passe massives), une faille courante dans le Top 10 de l'OWASP.

**Technologies et Librairies utilisées :**
- **Node.js / Express.js :** Architecture de base de l'API.
- **`express-rate-limit` (Middleware) :** Librairie standard de l'industrie pour le contrôle de flux HTTP.

**Réalisations techniques :**
- Implémentation du middleware `loginLimiter` ciblant exclusivement la route `POST /api/admin/login`.
- **Règles métier :** Restriction à 5 requêtes maximum par fenêtre de 15 minutes pour une même adresse IP.
- En cas de dépassement, le backend interrompt la chaîne de middleware (ne sollicitant plus PostgreSQL) et renvoie automatiquement un statut HTTP `429 Too Many Requests` avec un message explicatif pour le frontend.
- Activation des `standardHeaders` pour informer le client du quota restant directement dans les en-têtes HTTP, respectant les normes RESTful.

**Statut :** COULD-12 (#40) validée. Démonstration d'une approche "Security by Design". L'application gère activement les menaces réseau.

## 🔵 COULD-13 [PWA] Visualisation de données — Graphiques de revenus (Recharts) (#41)

**Objectif :** Rendre le tableau de bord de la direction plus visuel et professionnel en intégrant des outils de Business Intelligence (BI) permettant d'analyser d'un coup d'œil les tendances de rentabilité.

**Technologies et Librairies utilisées :**
- **React.js :** Architecture UI.
- **`recharts` :** Librairie de dataviz robuste, basée sur D3.js et optimisée pour React.

**Réalisations techniques :**
- Création du composant `<RevenueChart />`.
- **Traitement des données (`useMemo`) :** Création d'un algorithme agrégeant les montants de la liste des `shifts` bruts. Le code trie chronologiquement les données et fusionne les montants `attendu` et `reel` pour chaque journée (clé unique : "JJ/MM").
- **Intégration UI :** Affichage d'un `AreaChart` (Graphique en aires) responsive, avec un système de calques SVG pour les dégradés d'opacité (`linearGradient`). 
- **Interactivité :** Ajout d'un `Tooltip` personnalisé s'affichant au survol, formatant les devises dynamiquement.
- **Liaison des états :** Le graphique écoute l'état `filteredShifts`, ce qui signifie qu'il se met à jour en temps réel selon les dates sélectionnées par le directeur et selon les WebSockets (clôture en direct d'un jobiste).

**Statut :** COULD-13 (#41) validée. Le Dashboard franchit un cap ergonomique majeur.