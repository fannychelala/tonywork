# Revue du Lot 0 — Tony

Date : 3 octobre 2026. Statut : implémenté, quatre validations requises réussies ; validation humaine en attente, contrôles complémentaires non tous validés. Le Lot 1 n’est pas lancé.

## Résumé
Fondation Next.js 16.3.8 / React 19.3.0 / TypeScript 5.9.3 strict, Prisma 7.10.0, PostgreSQL 18 prévu en Compose, Zod 4.6.5. Node 24, pnpm 11.25.0. Page locale responsive fr-FR, dictionnaires fr/en, tokens CSS. Aucun domaine métier, compte utilisateur, appel réel, paiement ou API payante. Dépôt Git local sans remote.

## Fichiers modifiés
Projet neuf, inventaire complet : FILES.md. Groupes : configuration et lockfile ; src/app routes/page/styles ; src/server config/database/readiness/worker ; src/shared i18n/tokens ; prisma schéma/migration ; infra SQL ; tests unitaires/PostgreSQL/Chromium ; Docker/Compose ; CI/sécurité/Dependabot ; AGENTS.md, README.md, brief intégral, documentation et cinq ADR.

## Décisions prises
Monolithe modulaire ; modules créés progressivement ; aucun scaffolding métier prématuré. Comptes PostgreSQL applicatif et migration séparés. Sonde technique sans tenant ni données personnelles. RLS et Better Auth réservés au Lot 1. Worker inactif, sans prétendre fournir queue/retries. i18n typée/Intl, librairie de routage à décider avant préférences utilisateur. Déploiement standalone Node/Docker ; assets copiés pour lancement local. pnpm scripts tiers autorisés nominativement. ADR 0001 à 0005 détaillent les compromis.

## Migrations
Une migration additive crée system_probe et sa ligne foundation. Aucune table métier. init.sql provisionne uniquement les rôles locaux, schema owner et default privileges ; exécution sur volume neuf. Aucun credential migration dans image runtime app via Compose. Migration non exécutée ici faute de PostgreSQL démarrable.

## Tests ajoutés
Six tests unitaires : configuration invalide, messages sans credentials, URL PostgreSQL ; montants EUR/JPY/KWD, montants invalides, timezone/changement d’heure. Trois tests PostgreSQL réels : sonde migrée, rôle non propriétaire/non superuser/non BYPASSRLS, DDL interdit. Quatre E2E (deux scénarios sur desktop et mobile Chromium) : UI/langue/clavier/débordement et health.

## Tests exécutés et résultats
| Contrôle | Résultat |
|---|---|
| pnpm lint | Réussi, zéro warning |
| pnpm typecheck | Réussi |
| pnpm test | Réussi, 6/6 |
| pnpm build | Réussi, page statique et routes santé dynamiques |
| prisma validate / generate | Réussi |
| pnpm peers check | Réussi, aucun conflit |
| pnpm audit --prod --audit-level=high | Réussi, aucune vulnérabilité connue |
| pnpm audit complet | Un avis élevé sur braces dans les outils lint, sans version corrigée annoncée |
| pnpm test:integration | Non validé : aucune DB disponible |
| pnpm test:e2e | 2 tests HTTP réussis ; 2 tests UI bloqués au démarrage Chromium (permission macOS) |
| HTTP health | 200, no-store, headers attendus |
| HTTP readiness DB absente | 503 not_ready, sans détails ni secrets |
| Page navigateur intégré | Affichage fr-FR et rendu visuel observés |
| Docker/Compose et CI distante | Non exécutés, Docker absent et dépôt non publié |

Le défaut initial de validation URL a été corrigé ; tous les unitaires passent. ESLint 10 incompatible avec le plugin React fourni par Next : retour à 9.39.5 sans désactiver les règles. Après verrouillage des dépendances indirectes corrigées, génération Prisma, types et build passent.

## Tests manuels nécessaires avant clôture complète
Sur machine Docker/Compose disponible : pnpm local:up, readiness 200, worker actif sans traitement, redémarrage sans perte de données, arrêt propre. Exécuter migrations et trois tests PostgreSQL via rôle applicatif. Exécuter les quatre E2E Chromium, vérifier clavier et mobile. Publier vers un dépôt choisi par l’utilisateur puis vérifier CI, Docker smoke, CodeQL et Dependency Review. Ces contrôles ne sont pas implicitement considérés réussis.

## Risques résiduels
Environnement macOS restreint : PostgreSQL 18.4 temporaire n’a pas pu créer sa mémoire partagée (shmget interdit), même avec configuration mmap ; Chromium headless n’a pas pu enregistrer son port système (permission denied). Le navigateur intégré est utilisable mais ne remplace pas la suite Playwright. Docker non installé ; images et migrations non validées localement. Aucune donnée client ne doit être introduite avant Lot 1. Absence de source Pilotage : conformité à son code non vérifiée.

## Dette éventuelle
ESLint 9.39.5 déprécié : mise à jour à suivre lorsque les plugins sont compatibles. Un avis élevé non corrigé sur braces indirectement utilisé par la chaîne lint : n’accepter aucun pattern externe non fiable dans ces outils. Audit runtime exempt de vulnérabilités connues ; ceci ne couvre pas toutes les dépendances de développement. Voir ADR 0005 et suivi Dependabot. Overrides deepmerge-ts/mysql2 à retirer lorsque Prisma adopte des versions corrigées, après tests.

## Impact sécurité
Rôle DB applicatif sans DDL et non propriétaire prévu ; tests réels écrits mais non validés. Validation Zod au démarrage, erreurs génériques, aucune clé fournisseur. RLS/auth/audit non implémentés : aucune garantie multi-tenant à ce stade. Secret scanning/push protection nécessitent activation côté GitHub ; pas de certificat ISO annoncé.

## Impact performance
Page statique, polices système, aucun asset distant ni logique client métier. Pool DB borné et timeouts. Aucun benchmark ni mesure LCP/P95 en production : objectifs non démontrés.

## Impact i18n
Textes UI centralisés, fr-FR affiché, anglais typé en validation. Intl avec devise et timezone explicites, unités mineures adaptées aux devises. Pays et langue prospect/utilisateur/admin restent distincts dans l’architecture, non persistés au Lot 0.

## Rollback
Arrêter services avec pnpm local:down sans supprimer volume. Revenir au commit local précédent quand un historique existe. Projet neuf : conserver cette fondation comme baseline. Ne pas supprimer une base ou un volume pour annuler cette migration ; table sonde additive sans impact métier. Aucun service externe à désactiver.

## Prochain lot
Lot 1 uniquement après validation humaine explicite : Better Auth, User/Organization/Membership, sessions, OWNER/MEMBER/PLATFORM_ADMIN, tenant context, audit, RLS forcée et tests cross-tenant directs. Arrêt ici conformément à la section 165 du brief.
