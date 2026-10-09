# Constitution Codex — Tony

## Vision et périmètre
Transformer les demandes entrantes en opportunités, aider à agir et mesurer la valeur convertie. Lire docs/BRIEF.md avant toute évolution importante. Lot 0 officiellement validé le 4 octobre 2026. Lot 1 officiellement validé par revue humaine. Lot 2 officiellement validé par revue humaine, design system et shell applicatif (brief §126), sans nouvelle table/migration/dépendance. Lot 3 officiellement validé humainement ; CRM minimal, quatre tables seulement. Lot 4 officiellement validé humainement ; moteur pur simulé 1.0.0 et calibration technique non validée commercialement. Lot 5 LOCAL_FAKE est validé ; seule la préparation technique LIVE sans effet est autorisée selon docs/LOT_5_PLAN.md, ADR 0010 et le checkpoint. Processus/cluster expérimentaux isolés, aucun accès Tony, aucun credential ou effet fournisseur réel/test, aucune exposition publique. Gate 1 ouverte. Aucun LIVE_POC réel, Lot 6, fusion ou production sans nouvelle autorisation explicite.

## Autorisation courante Lot 5 — 9 octobre 2026
LOCAL_FAKE est validé humainement. La préparation technique LIVE sans effet est autorisée ; activation réelle, credentials live dans l’application, tunnel public, callbacks réels, numéro, coût, appel/SMS/audio, fusion et production restent interdits. US1 est accepté uniquement pour le futur provisionnement/routage administratif, trafic d’essai maintenu en IE1 et aucun credential US1 dans le processus. Transport IE1, réception HTTP, registre expérimental LIVE, quotas, nettoyage et commande opérateur sont préparés avec fixtures synthétiques. Le chargeur privé est branché derrière le verrou final ; le préflight Docker synthétique fonctionne sans port et avec egress entièrement fermé. Compte/MFA, T1/T2, consentements et conditions sont confirmés de manière expurgée ; inventaire exact, capacités, IE1, permissions, devis, auto-recharge, egress fournisseur restreint et manifeste complet restent bloqués. Aucun test existant ne doit être contourné ou affaibli. Voir docs/LOT_5_LIVE_PREPARATION_CHECKPOINT.md. Gate 1 ouverte, aucun Lot 6 autorisé.

## Méthode
Inspecter l’existant, lire ce fichier, identifier modules et risques, exposer le plan, implémenter, tester, vérifier les régressions, documenter. Pour un bug significatif : reproduire, trouver la cause, corriger, ajouter un test de régression et couvrir les cas proches.

## Architecture
Monolithe modulaire Next.js App Router. UI → action/API → service métier → repository → PostgreSQL. src/modules porte les domaines, src/server les infrastructures, src/providers les adaptateurs, src/shared les utilitaires et traductions, src/db le client généré. Créer les modules au moment du besoin. Aucun accès DB depuis un composant ; aucun SDK fournisseur dans l’UI. Pas de microservices ni Redis sans ADR justifiée.

## Conventions
TypeScript strict ; pas de any sans justification. Zod à toutes les frontières externes. Montants entiers en unités mineures et devise explicite ; téléphones E.164, jamais clés primaires ; dates UTC avec timezone explicite ; IDs imprévisibles. Fonctions et composants courts. Aucun code spécifique à un client : configuration, entitlement, flag ou template. Catalogue source de vérité des prix ; scoring déterministe et versionné, jamais calculé arbitrairement par LLM.

## Sécurité et isolation
Priorités : sécurité, isolation, intégrité, fiabilité, simplicité, maintenabilité, UX, performances. Toutes les données métier portent organizationId. Contexte tenant dérivé d’une session autorisée, jamais accepté d’un champ client seul. Requêtes tenantées et RLS FORCE ; rôle applicatif non propriétaire, sans BYPASSRLS. Contexte transactionnel local ; ne pas réutiliser un contexte de connexion. Auth/RLS au Lot 1 : voir ADR 0006. Séparer tony_auth/tony_app/tony_migrator. Les GUC ne constituent pas une preuve d’autorisation. PLATFORM_ADMIN distinct des rôles client, accès tenant audité. Dette sécurité acceptée du Lot 1 : un détenteur du compte SQL runtime et d’une session admin valide peut réutiliser un grant administrateur pendant sa minute de validité. Ne pas étendre cette durée, ses droits ni assouplir MFA, justification, portée session/tenant ou audit précommité dans les lots suivants. Audit append-only. Aucun secret, token, transcript complet ou donnée personnelle dans les logs. Aucun fichier .env commité.

## Internationalisation et UX
Textes centralisés dans src/shared/i18n, aucun texte UI dispersé. Séparer userLocale, organizationDefaultLocale et prospectLocale ; langue admin indépendante. Formats Intl avec devise et timezone explicites. Mobile first, focus visible, clavier, labels, contraste et cibles tactiles ≥44px. Pas de dashboard analytique complexe à l’accueil.

## Providers et jobs
Providers abstraits pour téléphonie, IA, maps, email, billing et stockage. Fakes par défaut en local ; aucune API payante sans configuration explicite. Prompts centralisés/versionnés ; sorties IA validées par Zod, retry borné et fallback. Webhooks signés, validés, persistés, idempotents puis traités hors requête. Jobs PostgreSQL avec lease, retry, backoff, dead-letter. Suppression audio suivie et alerte sur échec. Aucune promesse contractuelle automatique sans configuration explicite.

## Tests et migrations
pnpm lint, pnpm typecheck, pnpm test, pnpm build obligatoires. Vrais tests PostgreSQL ; au Lot 1 tests lecture/modification/suppression cross-tenant et absence de contexte sur chaque table sensible. Chromium E2E. Migration additive → backfill → validation → retrait après transition. Pas de migration destructive improvisée. Respecter le lockfile et les installs frozen en CI.

## Modèles recommandés
Luna : texte et UI triviale ; Terra : CRUD borné ; Sol Medium : modèle principal et Lot 0 ; Sol High : difficultés ; Astra : sécurité critique, RLS, revue préproduction. Escalader selon difficulté, pas par confort. Ne pas déléguer à des agents sans demande utilisateur ou instruction applicable.

## Fin de lot
Rapport : résumé, fichiers, décisions, migrations, tests ajoutés/exécutés/résultats, tests manuels, risques, dette, sécurité, performance, i18n, rollback et prochain lot. Ne pas annoncer une vérification non exécutée comme réussie.
