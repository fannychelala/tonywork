# Validation environnementale — Lot 0

Date : 4 octobre 2026.

Le Lot 0 est publié sur le dépôt fannychelala/tonywork, base c736dee.
Cette pull request ajoute uniquement un rapport pour déclencher les contrôles sur pull request, notamment Dependency Review. Aucun changement de code, de tests, de dépendances ou de périmètre produit.

## État avant CI distante
- Quatre validations Lot 0 locales réussies : lint, types, 6 tests unitaires, build.
- Docker/Compose local absent : stack complète, readiness 200, redémarrage avec conservation de volume et arrêt propre non validés localement.
- PostgreSQL local indisponible : trois tests réels non validés localement.
- Chromium local installé, mais lancement interdit par restrictions macOS : deux tests HTTP réussis, deux tests UI bloqués.
- Audit production propre. Avis braces présent uniquement dans les outils de développement, sans correctif publié indiqué par l’audit ; aucun override ajouté pour le masquer.
- Aucun client ou donnée réelle introduit.

## Contrôles GitHub
CI complète, Docker smoke et CodeQL déclenchés par la publication sur main. Cette pull request déclenche également Dependency Review. Les résultats seront inscrits après exécution ; la présence des workflows ne constitue pas une validation.

## Barrière de revue
Lot 1 interdit sans feu vert humain explicite après validation du Lot 0. Ne pas fusionner cette pull request automatiquement.
