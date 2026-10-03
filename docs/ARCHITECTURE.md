# Architecture initiale — Lot 0

Statut : proposition mise en œuvre, en attente de revue humaine.

Next.js 16 / React 19 / TypeScript strict, PostgreSQL 18, Prisma 7 avec adaptateur pg, Zod. Node 24 LTS et pnpm avec lockfile. Un dépôt, une application, un worker du même code ; déploiement Node portable par Docker. Better Auth/Resend restent prévus pour les lots concernés.

Flux futur : UI → action/API validée → service domaine autorisé → repository tenanté → transaction PostgreSQL/RLS. Providers externes accessibles seulement côté serveur. Aucun domaine métier au Lot 0. Le schéma ne contient qu’une sonde technique sans donnée personnelle.

## Structure
- src/app : routes et rendu.
- src/modules : domaines à ajouter progressivement.
- src/server : configuration, readiness et point d’entrée worker.
- src/providers : contrats/adaptateurs créés avec leurs premiers workflows.
- src/shared : i18n, validation et design tokens.
- src/db : client Prisma généré, ignoré par Git.
- prisma : schéma et migrations ; infra : initialisation PostgreSQL locale.

## Décisions structurantes
ADR 0001 : monolithe et périmètre ; 0002 : rôles DB séparés et RLS future ; 0003 : i18n et design tokens ; 0004 : runtime et reproductibilité.

## Risques
Pilotage absent : aucune convention supposée déjà vérifiée. Versions majeures récentes : validation par installation/build et lockfile. Isolation : aucun endpoint métier avant Lot 1 et ses tests RLS. Worker Lot 0 : processus de fond sans queue ni traitement métier. Docker/production : nécessitent vérification sur machine équipée. Auth, rate limiting, rétention, audit, restauration et observabilité complète restent des exigences futures, pas des garanties du Lot 0.
