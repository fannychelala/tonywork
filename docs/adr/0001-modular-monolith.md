# ADR 0001 — Monolithe et frontière du Lot 0

Statut : proposé, implémenté pour revue Lot 0.
Date : 2026-10-03

## Décision
Une application Next.js et un worker partageant le même dépôt ; aucun domaine métier.

## Motivation
Réduire les technologies et maintenir une architecture lisible par Codex.

## Conséquences
Les modules et providers sont créés au moment du besoin ; pas de scaffolding métier fictif.
