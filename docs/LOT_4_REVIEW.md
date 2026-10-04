# Lot 4 — Opportunity Engine V1, rapport de revue

4 octobre 2026. **Implémenté pour revue humaine ; validation humaine du Lot 4 non présumée.** [PR 15](https://github.com/fannychelala/tonywork/pull/15), branche `lot-4/opportunity-engine`, base Lot 3 officiellement validé (`lot-3/minimal-crm`, non fusionné). Aucune fusion, donnée réelle ou production. Arrêt après Lot 4, aucun Lot 5.

## Décisions réellement implémentées

ADR [0009](adr/0009-simulated-opportunity-engine.md), conforme au [plan validé](LOT_4_PLAN.md). Moteur TypeScript pur sur huit dimensions synthétiques, sans DB, connexion CRM, nouvelle table/colonne/migration/seed/backfill, API/route/action/job/UI, provider/SDK/dépendance/secret/service. Aucun logo intégré.

Calibration **technique V1 seulement**, pas modèle commercial empiriquement validé. Cette distinction figure dans le profil, chaque résultat, les avertissements d’explication, les fixtures/tests et la documentation. Les indices ne sont ni montants, ni kilomètres, ni disponibilités réelles, ni probabilités calibrées. Aucun effet métier ou engagement automatique.

Version 1.0.0 explicite et immuable ; latest/inconnues/mélanges refusés. Profil, seuils, dictionnaires et résultats/snapshots gelés récursivement. Null → INCOMPLETE sans score/priorité, fallback ou renormalisation. Explications déterministes fr-FR/en-GB, sans LLM. Classement de simulations complètes seulement, maximum100, même version, égalités explicites ; les incomplets restent séparés.

Aucune nouvelle frontière d’autorisation : moteur sans session, organizationId, identifiant CRM ou PII. Le code métier tenant et la correction withTenant sont inchangés. Les données synthétiques ne sont pas seedées ou transmises à l’UI. Historique durable tenanté et raccordement réel réservés au Lot 10 ; fixtures historiques Git seulement dans ce lot.

## Fichiers et absence de modification du périmètre protégé

| Groupe | Fichiers |
|---|---|
| Contrat/profil/calcul | `src/modules/scoring/contract.ts`, `profile.ts`, `engine.ts`, `index.ts` |
| Explications/i18n | `src/modules/scoring/explanation.ts`, `src/shared/i18n/scoring.ts` |
| Références/tests | `tests/unit/fixtures/scoring-v1.ts`, `scoring.test.ts`, `scoring-boundary.test.ts`, `scoring-cpu.test.ts` |
| Documentation/statuts | `docs/adr/0009-simulated-opportunity-engine.md`, `LOT_4_PLAN.md`, `SCORING.md`, ce rapport ; statut Lot 3 validé dans ADR0008/AGENTS.md ; README.md, captures `docs/review/lot-4/` |

Comparaison Git contre la base Lot 3 : **aucun changement** Prisma/migrations, package/lockfile, infrastructure, workflows CI/sécurité, src/app, CRM/auth/shell/server/UI, tests intégration/E2E existants. Les 19 tests unitaires existants restent également inchangés. Les fichiers de marque préexistants non suivis dans `output/` sont laissés intacts et exclus des commits.

## Formule, snapshot et exemples indépendants

Ordre des dimensions : economicPotential, effort, distance, urgency, conversionProbability, strategicFit, scheduleFit, customerValue. Poids entiers : 2500/1500/1000/1500/1000/1000/1000/500, somme10000. Utilité =x sauf effort/distance =100−x. ContributionNumerator =poids×utilité ; N=somme ; **scoreBasisPoints=floor((N+50)/100)**. Arrondi unique demi-vers-le-haut, aucun flottant/arrondi par contribution. Avec les poids V1, N/100 est entier ; les demi-valeurs sont couvertes séparément par le helper borné, sans second profil ajouté.

Priorité sur points de base exacts : ≥8000 VERY_HIGH ; ≥6500 HIGH ; ≥4500 NORMAL ; ≥2500 WAIT ; <2500 LOW. Présentation =points/100. Snapshot conserve valeur, inversion, poids, utilité, numérateur et code de raison de chaque dimension, avec source/version/calibration. INCOMPLETE conserve les informations connues, pas une estimation totale.

| Fixture historique | Huit valeurs d’entrée | N calculé indépendamment | Score / priorité |
|---|---|---:|---|
| sim-high | 90/20/10/80/70/90/80/60 | 825000 | 82,50 / VERY_HIGH |
| sim-costly | 90/90/80/40/50/60/30/20 | 470000 | 47,00 / NORMAL |
| sim-urgent | 60/40/5/100/60/60/70/40 | 695000 | 69,50 / HIGH |
| sim-distant | 30/80/90/10/20/30/20/10 | 205000 | 20,50 / LOW |
| sim-fit | 65/30/30/50/65/95/95/70 | 702500 | 70,25 / HIGH |

Détail sim-high : 225000+120000+90000+120000+70000+90000+80000+30000=825000 →8250 points →82,50. Ordre attendu : high, fit, urgent, costly, distant. Calculs et numérateurs de référence écrits indépendamment avant moteur, pas générés depuis ses sorties. Tests de rejeu comparent l’objet complet et chaque contribution.

Explication : utilité≥70 favorable, ≤30 défavorable, sinon intermédiaire ; unknown explicite. Au plus deux facteurs favorables/défavorables, poids décroissant puis ordre fixe des dimensions ; aucune catégorie inventée. Contributions numériques explicites, pas de fait commercial/causalité revendiquée. Même score/classement quelle que soit la langue. Égalités commerciales conservées, ordre technique ASCII par scenarioId, rangs de compétition 1,1,3 ; aucun avantage commercial induit par l’ID.

## Ordre de réalisation et corrections

1. ADR consignée et fixtures/tests négatifs écrits avant moteur. Première exécution ciblée échoue car le module n’existe pas encore : échec attendu, documenté, pas gate finale revendiquée.
2. Contrat Zod strict, profil fermé 1.0.0, calcul/snapshot, INCOMPLETE, raisons/classement, puis dictionnaires/explications. Tests techniques additionnels : snapshots complets, séparation des imports et mesures.
3. Validation locale et CI complète ; revue des captures, rapport et revalidation du commit final.

Corrections pendant validation : typage d’une table de couples de valeurs (`as const`, sans changer une assertion) ; faute d’addition du checksum de benchmark : somme des cinq scores =28975, répétée200 fois =**5795000**, pas6795000. Les cinq fixtures historiques, leurs contributions et leur ordre n’ont pas changé. Dictionnaires gelés pour éviter une mutation des explications versionnées. Aucune correction de withTenant, RLS, API/UI ou test antérieur, aucun skip/relaxation.

## Tests unitaires du moteur

**38 nouveaux +19 historiques =57/57**, neuf fichiers de tests. Couverture réelle :

- Champs inconnus/PII/tenant/session/identifiants CRM, source réelle, mauvais ID synthétique, champs imbriqués inconnus, clés absentes, chaînes, décimaux, NaN/infini, −1/101 : refus strict sans coercition.
- Cinq références historiques manuelles, snapshot entier exact, 0/100, numérateurs et arrondi sous/à demi-valeur, invalides du helper.
- Frontières exactes 25/45/65/80, juste avant/au seuil/après, seuil non calculé depuis un arrondi d’affichage.
- Monotonie de chacune des huit dimensions sur les101 valeurs entières0–100 ; effort/distance inversés, aucune action automatique.
- Profil/poids/seuils gelés, entrées gelées acceptées sans mutation, sorties détachées et gelées, rejeu exact version1.0.0.
- Null unique/multiple/toutes dimensions, aucun score/priorité ni renormalisation ; raisons aux frontières30/70 et compromis expliqués.
- Fr-FR/en-GB, contributions exactes, facteurs bornés/ordre stable et avertissement non commercial ; aucune unité/fait inventé, locale invalide refusée.
- Classement indépendant, égalités, renversement de l’ordre d’entrée sans effet, incomplets séparés, IDs dupliqués/versions inconnues ou mélangées/>100 refusés ;100 accepté et liste vide valide.
- Appels A/B alternés puis40 appels concurrents, résultats exacts et absence de marqueur de l’autre scénario ; ce test de pureté **ne prouve pas RLS**.
- Inspection AST du graphe runtime scoring et dictionnaire : imports limités à Zod/module/dictionnaire, imports de types limités ; aucune DB/Prisma/auth/provider/réseau/horloge/aléatoire/process/window/globalThis ou appel de console. Aucun objet tenant ne sert d’entrée.

## Commandes réellement exécutées et gates

### Mac local

`pnpm exec vitest run tests/unit/scoring.test.ts` : échec attendu avant moteur, puis34 cas réussis. `pnpm test`, `pnpm lint`, `pnpm typecheck` (db:generate), `pnpm build`, `pnpm audit --prod --audit-level=high` : réussis,57 tests. `pnpm exec vitest run tests/unit/scoring-cpu.test.ts --reporter=verbose --silent=false` : benchmark synthétique/checksums réussis. `pnpm audit --json` : une alerte high braces dev-only, production propre. `git diff --check` et comparaison ciblée des répertoires protégés : propres.

Node **24.19.0**, pnpm **11.25.0**, darwin/arm64. Docker et psql indisponibles localement ; aucun PostgreSQL/Docker/Chromium local exécuté ou revendiqué. Aucun serveur local lancé dans ce lot. Les gates correspondantes s’exécutent réellement sur Linux CI.

### Linux CI et sécurité

Sur le commit applicatif `8137f60` : [CI](https://github.com/fannychelala/tonywork/actions/runs/37222125936), [sécurité](https://github.com/fannychelala/tonywork/actions/runs/37222125909), tous réussis. La publication finale du rapport relance les mêmes gates sur la PR ; les résultats courants sont consultables sur celle-ci.

Commandes existantes effectivement exécutées :

```text
pnpm install --frozen-lockfile
psql <bootstrap CI> -v ON_ERROR_STOP=1 -f infra/postgres/init.sql
node scripts/check-crm-upgrade.mjs
pnpm db:migrate
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
pnpm exec playwright test tests/e2e/shell-ui.spec.ts --repeat-each=3 --output=test-results/focus-stability
pnpm audit --prod --audit-level=high
pnpm local:up
docker compose up -d --wait app worker
curl --fail http://localhost:3000/readiness
test "$(curl --fail --silent --show-error --output /dev/null --write-out '%{http_code}' http://localhost:3000/readiness)" = "200"
docker compose exec -T postgres psql ... -c "INSERT INTO system_probe (id) VALUES ('restart-validation');"
docker compose down
docker compose up -d --wait app worker
curl --fail http://localhost:3000/readiness
# même assertion HTTP 200 après redémarrage
docker compose exec -T postgres psql ... -Atc "SELECT count(*) FROM system_probe WHERE id = 'restart-validation';"
docker compose exec -T postgres psql ... -c "DELETE FROM system_probe WHERE id = 'restart-validation';"
docker compose down
test -z "$(docker compose ps --status running -q)"
```

Secrets/URLs éphémères non recopiés. CodeQL et Dependency Review exécutent les actions GitHub existantes sans modification. Analyse CodeQL PR `refs/pull/15/merge` sans erreur/avertissement, alertes ouvertes sur cette référence : liste vide.

| Gate | Résultat réel |
|---|---|
| Lint/typecheck/build | Réussis localement et CI |
| Unitaires | **57/57** |
| PostgreSQL 18 réel | **89/89**, régressions Lots1–3 conservées |
| HTTP/API et E2E Chromium desktop/mobile | **34/34**,17 par profil, sans retry/flaky |
| Répétitions clavier/focus | **6/6**, sans retry |
| Migration fraîche et upgrade CRM depuis Lot2 | Réussis, sonde conservée ; aucune migration Lot4 |
| Docker/readiness/redémarrage | HTTP **200** explicitement exigé avant/après ; sonde volume conservée, puis supprimée ; arrêt avec zéro conteneur actif |
| Audit production | Aucun avis de vulnérabilité connu |
| CodeQL/Dependency Review | Réussis |
| Vercel | Aperçu en échec, dette connue hors périmètre ; aucun déploiement production |

## Preuves de non-régression SQL/HTTP/E2E

Tests inchangés, réexécutés : tony_app non propriétaire sans BYPASSRLS/DDL, tony_auth sans droit CRM, ENABLE/FORCE sur quatre tables, PK/FK composites, identifiants immuables. Sur chaque table : A SELECT B vide, UPDATE/DELETE zéro effet, INSERT B refusé, B inchangé ; sans contexte/GUC falsifié refus ; OWNER local, MEMBER lecture seule, admin même avec grant exclu. Session expirée/révoquée/Membership supprimée retire le contexte ouvert. Audit SQL CRUD append-only sans PII, rollback métier/audit atomique ; audit administratif précommité conservé.

Régression withTenant : erreur primaire23505 conservée sans masquage25P02, contexte rollbacké, accès suivant correctement revalidé. Aucun changement de cette fonction acceptée.

HTTP réel : objets/parents/curseurs/collections B refusés, existence uniforme, Origin, champs interdits, taille, no-store, versions concurrentes200/409, absence d’idempotence réseau persistante. E2E : marqueurs B absents DOM/HTML/RSC/réseau, formulaire révoqué/historique et réponse retardée ne restaurent pas de données privées ; MEMBER sans écriture UI, POST direct refusé. Les huit scénarios HTTP font partie des34 E2E, sans double comptage.

## Visuel, accessibilité et non-injection

Aucune UI/route/styles modifiés. Captures réelles CI examinées manuellement : [Aujourd’hui](review/lot-4/today.png), [Contacts](review/lot-4/contacts.png), [Opportunités](review/lot-4/opportunities.png), [Prestations](review/lot-4/services.png), [Paramètres320px](review/lot-4/settings-320.png). Pas de badge de score, classement ou explication de fixture injecté. Régression clavier/focus, Escape, confirmations, labels, cibles tactiles et320px conservée par les tests existants.

Aucun nouveau contrôle d’accessibilité de scoring à revendiquer puisqu’aucun écran scoring n’existe. Inspection des captures ici, interactions réelles exécutées en CI ; lecteur d’écran/appareil physique et session interactive Mac toujours non réalisés, limites acceptées inchangées. Logos fournis réservés aux futurs lots UI.

## Mesures CPU synthétiques réellement effectuées

Méthode : horloge performance.now, durées murales de traitements de calcul sans I/O moteur ; ce ne sont pas des compteurs cycles CPU. Warmup1000 scores,20 échantillons de1000 scores (cinq fixtures cyclées), puis20 lots de10 classements de100 scénarios. Checksum1000 scores =5795000 et chaque classement100×50,00 =500000. Le temps de classement inclut la réduction/checksum et l’assertion du runner ; il ne constitue pas un microbenchmark du tri seul. Unitaire CPU et autres tests peuvent partager la charge du runner CI.

| Environnement / lot | P50 ms | P95 ms | Max ms |
|---|---:|---:|---:|
| Mac arm64 Node24.19.0,1000 scores | 1,758 | 2,327 | 3,246 |
| Même Mac,10 classements×100 scénarios | 1,999 | 2,347 | 2,439 |
| Linux CI Node24,1000 scores | 6,166 | 9,716 | 10,137 |
| Même CI,10 classements×100 scénarios | 6,968 | 10,168 | 16,097 |

Valeurs prises des exécutions précitées, pas des estimations. Aucun objectif P95 serveur<500ms, LCP, charge multi-tenant ou pertinence commerciale déclaré satisfait par ces mesures. Le moteur n’effectue aucune requête SQL/HTTP. Les mesures SQL/HTTP des tests CRM historiques restent des régressions synthétiques, pas une intégration scoring.

## Risques, dette, divergences et rollback

Aucune divergence fonctionnelle par rapport au cadrage autorisé. Les poids/seuils restent calibration technique ; les cinq scénarios ne sont pas une Gate3 ni des demandes réelles. Données manquantes sans classement, aucune prise de décision automatique, conversion future source réelle→indice encore à cadrer. Les versions historiques ne doivent pas être éditées pour une évolution de formule ; nouveau profil/version requis après validation de son périmètre.

Historique durable absent, résultats en mémoire uniquement ; registre V1 fermé. Le contrôle d’imports/immutabilité renforce le périmètre mais ne remplace ni une revue de sécurité ni PostgreSQL/RLS pour les données métier. Aucun élargissement du grant admin d’une minute ADR0006 ni de ses droits/MFA/audit.

Dettes acceptées conservées : braces dev-only, grant admin court, Mac, email simulé, nettoyage contextes/grants, Vercel, performance synthétique, lecteur d’écran/appareil physique et prérequis opérationnels production. Limite ADR0007 sur données déjà transmises inchangée. Aucune donnée réelle introduite ou connectée.

Rollback : revenir au code Lot3 validé, retirer les imports éventuels futurs du moteur si un autre lot les introduit ; **aucun rollback SQL/DROP/purge**, aucune nouvelle persistance. Références/version1.0.0 restent traçables dans Git. Aucune restauration/production exécutée dans ce lot.

**ARRÊT après Lot4 pour revue humaine. Aucun Lot5, fusion, production ou élargissement sans nouvelle autorisation explicite.**
