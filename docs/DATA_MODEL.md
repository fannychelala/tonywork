# Modèle de données — Lot 1

Prisma décrit User, Session, Account, Verification, RateLimit, TwoFactor et AuthMail pour Better Auth ; Organization, Membership et AuditLog pour le domaine tenant. system_probe conserve la sonde du Lot 0. Les identifiants d’identité et de domaine sont UUID, les dates timestamptz ; AuditLog possède une clé bigserial.

User.email est unique. Membership impose UNIQUE(organizationId,userId), des références explicites à Organization/User et un rôle OWNER/MEMBER. Les paramètres initiaux d’organisation sont defaultLocale, currency et timeZone, validés strictement à l’API et à la création SQL. PLATFORM_ADMIN est distinct de Membership.

AuditLog enregistre acteur, organisation éventuelle, événement, cible, corrélation et date ; aucun jeton. Les événements globaux d’identité n’ont pas de tenant et ne sont pas lisibles par le rôle tenant. Audit append-only par privilèges et trigger.

Le schéma privé tony_security contient les contextes transactionnels et grants administrateur ; il n’est pas exposé par Prisma ni accessible au runtime. Migrations SQL explicites pour permissions, politiques forcées et fonctions. La migration corrective sépare les branches du déclencheur d’audit afin de ne pas référencer un champ Membership sur Organization.

Les entités Contact, Opportunity, Call, facturation, etc. restent hors Lot 1. Lors de leur ajout, les références métier tenantées devront utiliser des contraintes composites pour interdire les liens cross-tenant.
