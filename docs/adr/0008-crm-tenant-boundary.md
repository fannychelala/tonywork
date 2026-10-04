# ADR 0008 — CRM minimal et frontière SQL

Date : 2026-10-04. Statut : accepté après validation humaine officielle du Lot 3.

## Décision
Quatre tables CRM uniquement : Contact, Opportunity, ServiceTemplate, Task. PK et FK composites organizationId/id, sans unicité globale id. Téléphone E.164 unique dans le tenant seulement. UUID/tenant immuables, suppression physique restrictive, Opportunity ARCHIVED comme seul archivage. Concurrence optimiste par version, sans idempotence réseau persistante.

OWNER lit/écrit, MEMBER lit seulement ; PLATFORM_ADMIN ne lit ni n’écrit CRM, même avec grant Lot 1. ENABLE/FORCE RLS et politiques par opération reposent sur current_context privé revalidé, non sur GUC. Grants DML explicites sur les quatre tables à tony_app ; tony_auth aucun droit. Audit SQL atomique append-only sans champs métier/PII. Fonctions triggers SECURITY DEFINER étroites, search_path fixé, non exécutables PUBLIC. Aucun changement aux grants/admin/MFA Lot 1.

API session vérifiée → Zod → service/repository → même withTenant → runtime PostgreSQL. DTO minimal, no-store, Origin strict pour mutations, pas de cache/prefetch tenant. Organization.timeZone existant est seule source du jour civil ; bornes UTC calculées avec PostgreSQL et timezone autorisée, DST compris. Aucun nouveau champ timezone.

## Conséquences
Migration additive atomique sans seed ni backfill. Tests SQL/API négatifs avant code, quatre opérations de chaque table, relations, audit et révocation. UI utilise Lot 2 et données exclusivement synthétiques en tests. Pas de provider, dépendance, cinquième table, scoring ou automatisation. Double soumission UI protégée, rejouabilité HTTP documentée sans garantie exactly-once. Rollback applicatif vers Lot 2 en conservant les tables.

Le plan validé docs/LOT_3_PLAN.md définit champs, index, transitions, suppression et gates. Dettes ADR 0006/0007 inchangées. Arrêt après Lot 3 pour revue humaine, aucun Lot 4.
