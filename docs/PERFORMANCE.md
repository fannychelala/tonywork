# Performance

## État du Lot 0
Page serveur statique, aucun client JS métier, police système sans téléchargement. Prisma pool borné à 5 et timeouts de connexion/requête pour readiness. Aucun fournisseur dans chemin web.

## Exigences et suites
Objectifs à mesurer en production : P95 serveur <500ms hors fournisseurs, LCP <2.5s mobile. Pas de garantie performance non mesurée. Repositories : pagination serveur, indexes tenant/filtre, colonnes sélectionnées, absence N+1. Traitements lents hors requête ; worker PostgreSQL avec lease au lot jobs. Cache seulement après mesures, jamais partagé entre tenants sans clé tenant. Charge avant lancement sur login, today, liste, recherche, intake et jobs.

## Lot 3
Listes serveur 25 éléments, plafond 50, curseur UUID validé dans le tenant, SELECT projetés, ordre id stable indexé par PK composite. Recherche strpos bornée sans extension ni cache. Aujourd'hui borne chaque groupe à 25, quatre requêtes métier après autorisation, aucun include par ligne. Formulaires de relation montés seulement à l'ouverture, options 50 maximum et pages/recherche séparées. Mesures SQL/HTTP réellement exécutées sur fixtures synthétiques détaillées dans LOT_3_REVIEW.md ; aucun SLA/P95 production ou résultat de charge extrapolé.
