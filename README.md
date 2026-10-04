# Tony — Lot 4 en revue

Assistant commercial et opérationnel pour les professionnels de terrain. Projet local ; fondation identité et isolation, aucune collecte réelle, aucune API payante. Brief intégral : docs/BRIEF.md. Constitution : AGENTS.md. Revues : docs/LOT_0_REVIEW.md, docs/LOT_2_REVIEW.md et docs/LOT_3_REVIEW.md.

## Pré-requis
Node 24 LTS, pnpm 11.25.0, Docker Engine avec Compose v2 pour PostgreSQL et lancement intégré.

## Configuration locale
Copier .env.example vers .env et remplacer BETTER_AUTH_SECRET par un secret aléatoire (32 octets minimum), par exemple `node -e 'console.log(require("node:crypto").randomBytes(32).toString("hex"))'`. Ne jamais commiter .env. AUTH_MAIL_MODE=local impose une URL loopback ; aucune donnée client.

## Lancement complet
```sh
pnpm local:up
```
Ouvrir http://127.0.0.1:3000 (la même origine que BETTER_AUTH_URL). PostgreSQL, migration, app et worker sont démarrés ; worker volontairement inactif au Lot 0. Aucun compte migration n’est injecté dans l’app. Arrêt : `pnpm local:down` ; volume PostgreSQL conservé.

## Développement avec rechargement
```sh
cp .env.example .env
pnpm install --frozen-lockfile
docker compose up -d postgres
docker compose run --rm bootstrap-auth
pnpm db:migrate
pnpm db:generate
pnpm dev
```
Le CLI pnpm charge .env pour les commandes Next/Prisma ; tests DB et worker le chargent explicitement. `pnpm worker` dans un second terminal. Les identifiants fournis sont strictement locaux.

## Vérification
```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:integration
pnpm exec playwright install chromium
pnpm test:e2e
```
Tests d’intégration : PostgreSQL démarré et migrations appliquées obligatoires. E2E : build et DATABASE_URL configurée ; la suite complète utilise les identités et organisations synthétiques en DB ; readiness exige la DB et la sonde migrée. Ne pas confondre health et readiness.

## CI et sécurité
CI : lint, typecheck, unitaires, vrais tests PostgreSQL de privilèges, build, Chromium desktop/mobile, audit dépendances et smoke Docker. CodeQL, Dependency Review et Dependabot configurés. Activer côté GitHub les protections de branche, secret scanning et push protection selon les capacités du dépôt. Aucune CI distante n’est réputée validée tant qu’elle n’a pas tourné.

## Périmètre et arrêt
Lot 0 validé. Lot 1 : Better Auth, identités, organisations/adhésions, sessions, audit et RLS forcée, voir docs/adr/0006-authentication-tenant-capability.md. Tests DB/E2E nécessitent DATABASE_URL, AUTH_DATABASE_URL, migrations et configuration auth locale. L’outbox ne remplace pas un provider email de production. Lots 1 et 2 validés humainement. Lot 3 autorisé puis livré pour revue ; aucun Lot 4 sans autorisation explicite. Vercel hors périmètre.

## Shell du Lot 2
Les cinq écrans sont disponibles à /app/<organizationId>/today, opportunities, contacts, services et settings. Une session synthétique autorisée du Lot 1 est nécessaire pour afficher le nom de l’organisation. L’identifiant de la route ne donne aucun droit. Sans session/adhésion, le shell présente un refus explicite et ne charge aucune donnée privée. Le Lot 3 ajoute le CRM minimal ci-dessous, sans nouveau parcours d’authentification.

Composants, navigation et états : docs/adr/0007-shell-rendering-and-navigation.md ; périmètre : docs/LOT_2_PLAN.md. Les formulaires d’exemple ne transmettent ni enregistrent leurs valeurs. Cette absence de domaine/table/migration/dépendance caractérise le Lot 2 validé ; le Lot 3 ajoute uniquement les quatre tables approuvées.

## CRM minimal du Lot 3
Contacts, opportunités, prestations et tâches manuels ; OWNER écrit, MEMBER lit seulement, PLATFORM_ADMIN refusé dans le CRM. RLS forcée et clés composites sur les quatre tables ; prix indicatifs stockés en unités mineures, version optimiste, audit SQL sans contenu métier. Aujourd’hui utilise Organization.timeZone existant. ARCHIVED est le seul archivage des opportunités ; suppressions physiques restrictives avec confirmation, aucune cascade.

API privée : /api/crm/<organizationId>/{contacts,services,opportunities,tasks}, fiche /<id>, et /today. DTO sans session/token, no-store et Origin strict pour mutations. Aucun cache/prefetch tenant ni idempotence réseau persistante. Aucun provider/dépendance ajouté. ADR 0008 et docs/LOT_3_PLAN.md détaillent le contrat.

La CI vérifie migration fraîche et upgrade additif depuis Lot 2, tous les tests précédents et nouveaux SQL/API/E2E, les répétitions clavier/focus, audit production, Docker et sécurité. Les fixtures sont exclusivement synthétiques. La présence du CRM ne permet aucune collecte réelle ni production avant prérequis opérationnels validés. PR laissée ouverte pour revue humaine.

## Opportunity Engine V1 (Lot 4)
Moteur pur sur simulations exclusivement, sans API/UI/DB ni intégration CRM : docs/SCORING.md et ADR 0009. Profil 1.0.0 et calibration technique, non validée commercialement. Rapport : docs/LOT_4_REVIEW.md. Lot 3 validé ; Lot 4 à revoir humainement, aucun Lot 5/fusion/production autorisés.
