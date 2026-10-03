# ADR 0004 — Runtime et reproductibilité

Statut : proposé, implémenté pour revue Lot 0.
Date : 2026-10-03

## Décision
Node 24 LTS, pnpm 11, versions exactes et lockfile ; Docker PostgreSQL 18 et build multi-stage.

## Motivation
Compatibilité Next 16/Prisma 7 et portabilité hors Vercel.

## Conséquences
Les URLs migrations et runtime sont distinctes ; build sans DB active, readiness exige une DB ; CI PostgreSQL et Chromium.
