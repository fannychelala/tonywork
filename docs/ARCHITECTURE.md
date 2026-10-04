# Architecture — Lots 0 et 1

Lot 0 validé. Lot 1 implémenté pour revue humaine. Next.js 16 / React 19 / TypeScript strict, PostgreSQL 18, Prisma 7 / pg, Zod, Node 24 et pnpm frozen lockfile. Monolithe modulaire portable par Docker ; worker sans workflow métier à ce stade.

Routes auth → Better Auth / Prisma avec compte tony_auth. Routes organisations → validation Zod / session serveur → service → transaction tony_app / RLS. PostgreSQL vérifie le contexte depuis les sessions et memberships ; aucun GUC client ne donne de droit. Consultation plateforme auditée avant la transaction de lecture. Les comptes migration, identité et tenant sont séparés ; le migrateur n’est pas injecté dans l’application.

src/app : routes/rendu ; src/modules/auth et organizations : domaines Lot 1 ; src/server : infrastructure, config et sécurité ; src/shared : i18n/tokens ; src/db : client généré ignoré. prisma et infra portent migrations et bootstrap explicites.

ADR 0001–0005 conservent les décisions du Lot 0. ADR 0006 décrit les capacités transactionnelles, la séparation identité/tenant et l’audit administrateur résistant au rollback. Resend sera requis avant usage client ; l’outbox locale bloque les URL non loopback. Aucune donnée réelle, aucun provider payant, aucun scaffolding Lot 2.

Restent avant production : email réel, proxies fiables, sauvegarde/restauration, nettoyage des contextes abandonnés, observabilité opérationnelle et revue sécurité. Les validations Docker/Chromium/PostgreSQL s’exécutent sur Linux CI compte tenu des restrictions Mac documentées. Vercel exclu du périmètre.
