# ADR 0002 — Rôles PostgreSQL et isolation

Statut : proposé, implémenté pour revue Lot 0.
Date : 2026-10-03

## Décision
Séparer tony_app (DML, non propriétaire) de tony_migrator (DDL). Préparer RLS FORCE au Lot 1.

## Motivation
Les migrations nécessitent des privilèges que le serveur web ne doit pas posséder.

## Conséquences
La sonde technique n’est pas tenantée. Aucun accès client n’est sécurisé par RLS à ce stade. Credentials locaux uniquement, rôles CI vérifiés contre PostgreSQL.
