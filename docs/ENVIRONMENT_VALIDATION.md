# Validation environnementale — Lot 0

Date : 4 octobre 2026.

Le Lot 0 est publié sur le dépôt fannychelala/tonywork, base c736dee.
Cette pull request ajoute un rapport et complète la vérification environnementale Docker dans la CI : lancement par pnpm local:up, readiness, arrêt/redémarrage avec conservation d’une sonde technique en PostgreSQL, suppression de cette sonde et vérification finale des conteneurs arrêtés. Aucun changement du code applicatif, des tests applicatifs, des dépendances ou du périmètre produit.

## État avant CI distante
- Quatre validations Lot 0 locales réussies : lint, types, 6 tests unitaires, build.
- Docker/Compose local absent : stack complète, readiness 200, redémarrage avec conservation de volume et arrêt propre non validés localement.
- PostgreSQL local indisponible : trois tests réels non validés localement.
- Chromium local installé, mais lancement interdit par restrictions macOS : deux tests HTTP réussis, deux tests UI bloqués.
- Audit production propre. Avis braces présent uniquement dans les outils de développement, sans correctif publié indiqué par l’audit ; aucun override ajouté pour le masquer.
- Aucun client ou donnée réelle introduit.

## Contrôles GitHub
La publication sur main a passé la CI complète (6 unitaires, 3 tests PostgreSQL, 4 E2E desktop/mobile, lint, types, build et audit production), le Docker smoke avec readiness et CodeQL. Preuves : https://github.com/fannychelala/tonywork/actions/runs/37185954789 et https://github.com/fannychelala/tonywork/actions/runs/37185954814. Cette pull request déclenche également Dependency Review et les vérifications Docker de redémarrage/conservation du volume/arrêt. Leur validation requiert les résultats du dernier commit ; aucun succès anticipé.

## Barrière de revue
Lot 1 interdit sans feu vert humain explicite après validation du Lot 0. Ne pas fusionner cette pull request automatiquement.
