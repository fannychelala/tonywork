# ADR 0009 — Opportunity Engine V1 simulé

Date : 2026-10-04. Statut : cadrage validé explicitement ; implémentation Lot 4 autorisée, livraison à soumettre à revue humaine.

Moteur TypeScript pur et déterministe sur huit indices synthétiques entiers 0–100/null. Profil technique immuable 1.0.0, poids 25/15/10/15/10/10/10/5, effort/distance inversés ; calcul entier, contributions et snapshot explicables. Calibration technique, **pas modèle commercial empiriquement validé**.

Null produit INCOMPLETE sans score/priorité ni renormalisation. Versions inconnues et latest refusés. Classement borné à 100 simulations, même version, égalités explicites et ordre technique stable. Explications typées fr-FR/en-GB sans LLM, montant, distance ou disponibilité inventés. Fixtures historiques indépendantes et immuables.

Aucune DB, persistance, migration, seed, API, UI, action, job, provider, dépendance, secret ou intégration CRM. Le moteur n’autorise aucun accès tenant et ne démontre pas la RLS ; toutes les gates Lot 3 restent bloquantes, notamment rollback withTenant. Les frontières et dettes ADR 0006–0008 restent inchangées. Persistance durable et intégration réelles à cadrer au Lot 10.

Plan contractuel : docs/LOT_4_PLAN.md. Arrêt après Lot 4 ; aucun Lot 5, fusion ou production sans nouvelle validation.
