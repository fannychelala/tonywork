# Tony — Lot 1 en revue

Assistant commercial et opérationnel pour les professionnels de terrain. Projet local ; fondation identité et isolation, aucune collecte réelle, aucune API payante. Brief intégral : docs/BRIEF.md. Constitution : AGENTS.md. Revue : docs/LOT_0_REVIEW.md.

## Pré-requis
Node 24 LTS, pnpm 11.25.0, Docker Engine avec Compose v2 pour PostgreSQL et lancement intégré.

## Configuration locale
Copier .env.example vers .env et remplacer BETTER_AUTH_SECRET par un secret aléatoire (32 octets minimum), par exemple `node -e 'console.log(require("node:crypto").randomBytes(32).toString("hex"))'`. Ne jamais commiter .env. AUTH_MAIL_MODE=local impose une URL loopback ; aucune donnée client.

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
Tests d’intégration : PostgreSQL démarré et migrations appliquées obligatoires. E2E : build et DATABASE_URL configurée ; tests UI disponibles sans DB, readiness exige la DB et la sonde migrée. Ne pas confondre health et readiness.

## CI et sécurité
CI : lint, typecheck, unitaires, vrais tests PostgreSQL de privilèges, build, Chromium desktop/mobile, audit dépendances et smoke Docker. CodeQL, Dependency Review et Dependabot configurés. Activer côté GitHub les protections de branche, secret scanning et push protection selon les capacités du dépôt. Aucune CI distante n’est réputée validée tant qu’elle n’a pas tourné.

## Périmètre et arrêt
Lot 0 validé. Lot 1 : Better Auth, identités, organisations/adhésions, sessions, audit et RLS forcée, voir docs/adr/0006-authentication-tenant-capability.md. Tests DB/E2E nécessitent DATABASE_URL, AUTH_DATABASE_URL, migrations et configuration auth locale. L’outbox ne remplace pas un provider email de production. Aucun Lot 2 sans validation humaine explicite. Vercel hors périmètre.
