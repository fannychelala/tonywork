# Performance

## État du Lot 0
Page serveur statique, aucun client JS métier, police système sans téléchargement. Prisma pool borné à 5 et timeouts de connexion/requête pour readiness. Aucun fournisseur dans chemin web.

## Exigences et suites
Objectifs à mesurer en production : P95 serveur <500ms hors fournisseurs, LCP <2.5s mobile. Pas de garantie performance non mesurée. Repositories : pagination serveur, indexes tenant/filtre, colonnes sélectionnées, absence N+1. Traitements lents hors requête ; worker PostgreSQL avec lease au lot jobs. Cache seulement après mesures, jamais partagé entre tenants sans clé tenant. Charge avant lancement sur login, today, liste, recherche, intake et jobs.
