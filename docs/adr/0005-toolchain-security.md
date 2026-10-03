# ADR 0005 — Compatibilité et dépendances indirectes

Statut : proposé, implémenté pour revue Lot 0.
Date : 2026-10-03

## Décision
ESLint 9.39.5 conservé temporairement, malgré sa dépréciation déclarée par le registre. ESLint 10.0.3 a été testé et échoue avec eslint-plugin-react utilisé par la configuration Next 16 ; aucune règle n’est désactivée pour masquer cet échec. Migrer dès compatibilité des plugins.

Overrides pnpm : deepmerge-ts 8.0.2 et mysql2 3.24.5 corrigent les avis de sécurité transmis indirectement par Prisma 7.10.0. L’audit n’est pas désactivé. Génération Prisma, validation du schéma, typecheck et build vérifiés avec ces versions. Les migrations et tests PostgreSQL restent à confirmer sur une machine sans restriction mémoire partagée.

Scripts d’installation autorisés explicitement pour @prisma/engines, esbuild, prisma et unrs-resolver ; aucune autorisation globale. Versions exactes et lockfile.

## Sources techniques consultées
- [Installation Next.js](https://nextjs.org/docs/app/getting-started/installation)
- [Migration Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Générateur Prisma](https://www.prisma.io/blog/why-prisma-orm-generates-code-into-node-modules-and-why-it-ll-change)
- [Client Prisma](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/introduction)
- [Avis deepmerge-ts](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)
- [Avis mysql2](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr)
- [Avis mysql2 décompression](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3)

## Avis restant dans les outils de développement
L’audit complet signale [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) sur braces <=3.0.3, via eslint-config-next → fast-glob → micromatch. Aucune version corrigée annoncée par le registre. Ne pas traiter de patterns externes non fiables dans la chaîne lint. L’audit CI couvre les dépendances production ; ce risque de développement reste explicite et suivi.
