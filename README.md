# Tony — Lot 0

Assistant commercial et opérationnel pour les professionnels de terrain. Projet local ; aucune fonctionnalité métier, aucune collecte réelle, aucune API payante. Brief intégral : docs/BRIEF.md. Constitution : AGENTS.md. Revue : docs/LOT_0_REVIEW.md.

## Pré-requis
Node 24 LTS, pnpm 11.25.0, Docker Engine avec Compose v2 pour PostgreSQL et lancement intégré.

## Lancement complet
```sh
pnpm local:up
```
Ouvrir http://localhost:3000. PostgreSQL, migration, app et worker sont démarrés ; worker volontairement inactif au Lot 0. Aucun compte migration n’est injecté dans l’app. Arrêt : `pnpm local:down` ; volume PostgreSQL conservé.

## Développement avec rechargement
```sh
cp .env.example .env
pnpm install --frozen-lockfile
docker compose up -d postgres
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
Tests d’intégration : PostgreSQL démarré et migrations appliquées obligatoires. E2E : build et DATABASE_URL configurée ; tests UI disponibles sans DB, readiness exige la DB et la sonde migrée. Ne pas confondre health et readiness.

## CI et sécurité
CI : lint, typecheck, unitaires, vrais tests PostgreSQL de privilèges, build, Chromium desktop/mobile, audit dépendances et smoke Docker. CodeQL, Dependency Review et Dependabot configurés. Activer côté GitHub les protections de branche, secret scanning et push protection selon les capacités du dépôt. Aucune CI distante n’est réputée validée tant qu’elle n’a pas tourné.

## Périmètre suivant
Lot 1 : Better Auth, organisations, memberships, audit et RLS, uniquement après validation humaine du Lot 0. Pas d’isolation client implémentée ni certifiée au Lot 0. Ce dépôt ne peut pas accueillir de données clients.
