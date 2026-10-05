# Lot 5 — Rapport intermédiaire LOCAL_FAKE

Date : 2026-10-05. **LOCAL_FAKE implémenté et gates exécutées avec succès. Gate 1 ouverte.**

Aucun PROVIDER_TEST/LIVE_POC, compte fournisseur, credential fournisseur réel ou test préexistant, numéro réel, tunnel public, callback Twilio réel, appel, SMS, voix enregistrée ou coût fournisseur. Aucune fusion ni production. PR de revue **draft** : [#16](https://github.com/fannychelala/tonywork/pull/16), base `lot-4/opportunity-engine`, branche `lot-5/local-fake-telephony`.

## Référence exacte et décisions

Commit de code validé : **`cda3dbf2b7bd295c4d6f14391f6329521bb55e6e`**. Le commit documentaire de livraison qui ajoute ce rapport ne modifie pas cette implémentation ; son SHA figure dans la livraison et l'historique de la PR.

[ADR 0010](adr/0010-isolated-telephony-poc.md) : processus Node expérimental, cluster/rôles/volume/réseau distincts, zéro capacité CRM/auth/scoring, mode fermé LOCAL_FAKE, signature officielle avant projection, déduplication durable et quotas avant effets, résultat ambigu UNKNOWN, nettoyage audio à preuves cumulatives. Les ADR précédentes et le grant administrateur court restent inchangés.

La configuration n'accepte que la base `tony_poc`, le rôle `tony_poc_runtime`, les paramètres locaux synthétiques et les hôtes locaux prévus. Modes PROVIDER_TEST/LIVE_POC et champs inconnus refusés. Le processus refuse les variables Twilio, Better Auth et URL SQL Tony ; aucun chargement dotenv. Aucun client REST réseau Twilio construit : transport HTTP expérimental injecté et exclusivement simulé. Le SDK officiel vérifie les signatures ; les conversions REST sont testées sur réponses synthétiques, sans prétendre valider le fournisseur.

## Fichiers et dépendances

- `docs/LOT_5_PLAN.md` : plan et correction audio préalablement approuvés, ajoutés au suivi Git ; `docs/adr/0010-isolated-telephony-poc.md`, présent rapport et `AGENTS.md` : décisions/périmètre/arrêt.
- `experiments/telephony-poc/config.ts`, `provider.ts`, `webhook.ts`, `repository.ts`, `server.ts`, `main.ts` : configuration, contrat/fake/adaptateur fermé, cinq callbacks, registre transactionnel et CLI locale.
- `experiments/telephony-poc/sql/001-poc.sql`, `compose.yml`, `Dockerfile`, `network-check.mjs`, `restart-proof.mjs`, `README.md` : cluster, rôles, isolation et protocole opérateur.
- `experiments/telephony-poc/tests/{fixtures,security.test,behavior.test,http.test,sql.test,unit.config}.ts`, `vitest.config.ts` : vecteur synthétique indépendant, tests négatifs, HTTP et PostgreSQL réel.
- `.github/workflows/poc-local-fake.yml` : suites POC et validation des deux stacks ; `package.json`/`pnpm-lock.yaml` : **unique dépendance directe ajoutée `twilio` exactement 6.1.2**, licence MIT, engine Node >=20, compilation/tests réels sous Node 24. Ses dépendances transitives sont verrouillées, sans nouvel override. Audit production : zéro vulnérabilité connue.

Aucun fichier applicatif sous `src/`, schéma Prisma, migration Tony, workflow Tony existant ou test existant modifié. Aucun logo intégré. `output/` préexistant reste non suivi et intact.

## Migration et privilèges POC

`001-poc.sql` initialise atomiquement les deux rôles et les deux seules tables dans **le cluster expérimental**. Propriétaire des deux tables : `tony_poc_migrator`. Runtime non propriétaire, NOSUPERUSER/NOCREATEDB/NOCREATEROLE/NOINHERIT/NOBYPASSRLS, CONNECT et USAGE ciblés, aucun CREATE dans le schéma.

- `PocOperation` : UUID, campagne/compte synthétiques fixés, type/état/statuts bornés, SID, version, obligation audio/échéance/essais et indicateurs de preuve. Clé composite compte/campagne/id, unicité ressource, index de nettoyage.
- `PocWebhookReceipt` : identité technique structurée, FK composite vers l'intention, route/ressource/statut/séquence/date ; unicité durable d'événement. Aucun corps brut, téléphone, SMS libre, secret, URL audio ou octet audio.
- Runtime : SELECT/INSERT sur les deux tables ; UPDATE **seulement** sur les colonnes d'état nécessaires de `PocOperation`. Aucun UPDATE/DELETE des reçus, DELETE/TRUNCATE/DDL, changement de type/id/échéance ni SET ROLE migrateur.
- CHECK interdit `DELETED` si les indicateurs obligatoires ne sont pas satisfaits. PostgreSQL contrôle la cohérence des preuves stockées ; il ne vérifie pas lui-même une suppression fournisseur. Ces tables ne sont pas des tables tenantées Tony et ne prétendent pas constituer une nouvelle preuve RLS.

Les tests utilisent le runtime pour les contrôles et refus, le migrateur exclusivement pour préparation/purge des fixtures synthétiques. Aucun bypass de test runtime.

## Preuves d'isolation

Le job `network` lance simultanément Tony et le POC. Il vérifie : aucun réseau partagé, réseau POC `internal: true`, aucune URL/credential Tony dans le container POC, aucune configuration POC dans l'application Tony, aucun montage du volume Tony partagé.

Les sondes TCP depuis le container POC vers l'IP PostgreSQL Tony et depuis l'application Tony vers l'IP PostgreSQL POC échouent ; l'egress vers `api.twilio.com:443` est également refusé. Résultat : **`BIDIRECTIONAL_NETWORK_AND_CREDENTIAL_ISOLATION_OK`**. Les rôles `tony_app`/`tony_auth` ne peuvent pas s'authentifier au cluster POC. La séparation réseau bloque cet accès avant même une autorisation SQL.

Preuve supplémentaire sur arrêt/redémarrage complet du serveur **et PostgreSQL** : `SYNTHETIC_RECEIPT_COMMITTED` avant arrêt, puis `SYNTHETIC_REPLAY_DEDUPLICATED_AFTER_FULL_RESTART` après reprise. Le même callback signé est rejoué : un seul reçu et une seule intention subsistent.

Le graphe d'import runtime est contrôlé par AST : pas de module produit, CRM, Prisma, Better Auth, `withTenant`, scoring ou client réseau externe/dynamique. La configuration ne reçoit pas d'identité tenant. Cookies, organisation client ou headers proxy ne donnent aucun droit. Aucun grant admin implicite. L'environnement de référence isolé est **Compose** ; les tests HTTP lancés sur le runner/hôte servent à vérifier les handlers et ne sont pas présentés comme une isolation réseau de l'OS hôte.

Les régressions A/B Tony sont conservées et repassent intégralement : accès direct PostgreSQL, RLS forcée, rôles/session/contextes falsifiés, HTTP, DOM/HTML/RSC/réseau/prefetch, déconnexion et historique. Le POC n'a aucune capacité d'écrire le CRM ; aucun `organizationId` signé ou cookie ne peut ouvrir un contexte Tony.

## HTTP, déduplication, concurrence et reprise

Cinq POST sous `/poc/webhooks/twilio/` : `voice`, `dial-result`, `call-status`, `message-status`, `recording-status`. Aucun endpoint public opérateur. HTTP non publié dans Compose, serveur loopback dans le container. Voice/Dial renvoient uniquement un Hangup synthétique ; aucun forwarding réel implémenté.

Méthode, MIME, UTF-8, taille 32 KiB, nombre/taille de paramètres, encodages et doublons de clés contrôlés. SDK Twilio sur tous les paramètres et URL canonique fixe **avant** projection Zod ; Host/X-Forwarded-* non utilisés pour reconstruire l'URL. Compte/ressource attendus obligatoires. DTO interne projeté, paramètres fournisseur supplémentaires non persistés. `organizationId` refusé.

Admission : 30 requêtes/s globales, 300/minute/ressource, mémoire de suivi bornée. 2xx après commit uniquement, 503 si persistance échoue, erreurs génériques sans payload, `no-store`. Tests positifs et négatifs des cinq routes, proxy/cookie, MIME/méthode/query, surcharge, corps invalide et panne SQL.

La contrainte unique SQL conserve les doublons après restart, y compris six réceptions parallèles. Une collision de même identité/séquence avec statut différent est rejetée ; événements retardés conservés sans régression d'état terminal. Résultat Dial distinct de l'état parent : `no-answer` n'est pas remplacé par le `completed` de l'appel parent. Aucun webhook ne crée de SMS ou d'appel REST.

Intention et quota commités avant effet, vérifiés pendant l'effet et sous concurrence : une exécution du même UUID, cinq SMS maximum sur dix intentions concurrentes, aucun dépassement. Campagne fixe, quotas non remis à zéro au redémarrage. L'identifiant/type/échéance ne sont pas modifiables par runtime.

Réservation initiale UNKNOWN : un crash peut précéder ou suivre l'effet. Timeout/perte de réponse/malformed success/5xx ou échec de persistance après effet restent UNKNOWN ; aucun retry créateur automatique. Délai borné à cinq secondes. UUID réservé non réexécutable après nouvelle instance du repository. SID absent : `MANUAL_RECONCILIATION_REQUIRED`, pas de recherche/effet inventé. SID d'appel connu : lecture bornée et mise à jour optimiste par version ; conflit refusé, aucune création. Les intentions non résolues consomment le quota.

## Audio : preuves exclusivement synthétiques

Le fake conserve des métadonnées synthétiques après suppression et expose un média non récupérable. `DELETED` exige DELETE confirmé, statut fournisseur `deleted` lorsqu'exposé (absence documentable représentée par null), média non récupérable et authentification du contrôle valide.

Tests bloquants : DELETE non confirmé, statut incompatible, média encore servi, contrôle non authentifié/inconclusif, échéance dépassée ou SID inconnu → pas de DELETED, obligation persistante/DELETE_FAILED et refus de nouveau RECORD. Restart reprend le nettoyage ; au maximum trois tentatives durables, nettoyage concurrent sérialisé sans double suppression d'une obligation déjà terminée. Aucun appel fournisseur durant une transaction SQL ouverte.

La CLI permet nettoyage explicite ; le serveur contrôle les obligations toutes les deux secondes et au démarrage/arrêt. Échec : alerte technique sans donnée personnelle, fermeture d'admission et exit non nul. Échéance quinze minutes vérifiée, credentials locaux de nettoyage conservés jusqu'au contrôle. La stack de validation ne laisse aucune obligation audio active ; les cas négatifs restent des fixtures SQL détruites uniquement par le rôle de préparation hors runtime.

Les métadonnées Recording fournisseur peuvent rester visibles environ 40 jours après suppression du média selon [Twilio](https://www.twilio.com/docs/voice/api/recording). Suppression du média, disparition des métadonnées et effacement physique des sauvegardes sont distincts. **Aucune preuve réelle de DELETE, média ou rétention Twilio n'est acquise par le fake.** La sonde de média de l'adaptateur est uniquement simulée ; aucun fichier/voix n'est récupéré ou conservé.

## Commandes réellement exécutées et résultats

Local Mac : `pnpm view twilio@6.1.2 version engines license --json`, `pnpm add --save-exact twilio@6.1.2`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm exec vitest run --config experiments/telephony-poc/tests/unit.config.ts`, `pnpm audit --prod --json`, `git diff --check`. Toutes réussies ; audit JSON zéro vulnérabilité à tous niveaux. Docker/psql absents sur ce Mac : aucune prétendue exécution locale de leurs gates. Installation Chromium et E2E effectuées en Linux CI.

CI sur commit de code exact ci-dessus :

| Contrôle | Résultat réel |
| --- | --- |
| Lint, typecheck, build | Pass |
| Tony unitaires | **57/57** |
| POC unitaires | **32/32** (13 sécurité + 19 comportement/adaptateur) |
| POC HTTP sans SQL | **9/9** |
| POC PostgreSQL/HTTP avec base réelle | **37/37** ; total POC **78/78** |
| Tony PostgreSQL réels | **89/89**, six fichiers, dont RLS/A-B/privilèges/audit/concurrence/DST/withTenant |
| Tony Chromium desktop/mobile | **34/34** |
| Clavier/focus répété, aucun retry | **6/6**, repeat-each=3 |
| Audit production | Aucune vulnérabilité connue |
| Docker Tony | Readiness exactement HTTP 200 avant/après restart, sonde persistée dans volume, arrêt vérifié |
| Docker POC | Isolation bidirectionnelle/egress, intention et reçu conservés après restart complet, même callback rejoué sans duplication, serveur prêt, arrêt des deux stacks vérifié |
| CodeQL / Dependency Review | Pass ; aucune alerte CodeQL ouverte sur la référence merge de PR 16 au contrôle |

Commandes CI réellement exécutées : `pnpm install --frozen-lockfile`, initialisation SQL Tony, `node scripts/check-crm-upgrade.mjs`, `pnpm db:migrate`, lint/typecheck/test/test:integration/build, `pnpm exec playwright install --with-deps chromium`, `pnpm test:e2e`, `pnpm exec playwright test tests/e2e/shell-ui.spec.ts --repeat-each=3 --output=test-results/focus-stability`, `pnpm audit --prod --audit-level=high`.

POC : `psql .../tony_poc -v ON_ERROR_STOP=1 -f experiments/telephony-poc/sql/001-poc.sql`, `pnpm exec vitest run --config experiments/telephony-poc/vitest.config.ts`, `docker compose -f experiments/telephony-poc/compose.yml up --build -d --wait`, `node experiments/telephony-poc/network-check.mjs`, CLI `execute <UUID synthétique> CALL --confirm-synthetic` dans le container, `node experiments/telephony-poc/restart-proof.mjs before`, down/up sans -v, `restart-proof.mjs after`, SELECT de persistance et HTTP 405 attendu sur GET Voice (preuve que le serveur est prêt), arrêt et absence de containers actifs.

Tony : `pnpm local:up`, `docker compose up -d --wait app worker`, curl readiness avec assertion exacte 200, insertion de `system_probe`, down/up, vérification 200/une ligne conservée, suppression de la sonde et arrêt. Les workflows exécutent CodeQL et Dependency Review sans secret fournisseur ni job live.

Runs vérifiés : [CI 37279325764](https://github.com/fannychelala/tonywork/actions/runs/37279325764), [POC 37279325882](https://github.com/fannychelala/tonywork/actions/runs/37279325882), [Security 37279325859](https://github.com/fannychelala/tonywork/actions/runs/37279325859), tous `success` sur `cda3dbf2b7bd295c4d6f14391f6329521bb55e6e`. Les runs push correspondants et l'historique des corrections sont visibles dans la PR. Rapport seul ajouté après ces preuves ; code inchangé.

Mesure réelle CI : 25 callbacks **synthétiques dupliqués** signés, serveur HTTP local et transaction PostgreSQL de déduplication, à chaud : p50 **2,900 ms**, p95 **3,729 ms**, max **4,519 ms**. Assertion p95 < 500 ms passée. Ce sont des durées aller-retour synthétiques ; pas une mesure de réseau fournisseur, de CPU isolé, de nouvel événement à froid ou un SLA de production.

## Corrections, écarts et limites

Corrections pendant le lot, sans réduction d'assertion :

1. USAGE du schéma accordé sous bootstrap plutôt que migrateur non propriétaire du schéma ; cause des erreurs « relation absente » dans les premiers tests runtime.
2. Copie de `pnpm-workspace.yaml` dans l'image pour installation frozen cohérente ; aucun contournement du lockfile/override.
3. Healthcheck POC explicite : un container running n'impliquait pas un serveur prêt après restart. Test conservé et corrigé à la source.
4. UNKNOWN durable dès réservation, SID fake unique entre instances, résultat ambigu borné et non rejoué ; réconciliation persistée avec version.
5. Nettoyage hors transaction provider, sérialisation des nettoyages, limite d'essais/échéance, probes média/auth séparées et suivi actif.
6. Grants UPDATE limités aux colonnes nécessaires, statuts et identité d'événement SQL contraints ; tests supplémentaires de refus et d'import AST.

Aucun élargissement vers Lot 6. L'adaptateur REST, les states et la suppression sont éprouvés **sur un transport simulé**, pas contre Twilio. Aucun forwarding Dial réel, provisioning fournisseur, tarification, numéro Voice/SMS, consentement réel, résidence/rétention fournisseur ou suppression physique n'a été validé. Un UNKNOWN sans SID reste à traiter manuellement ; aucun mécanisme d'exactly-once réseau fournisseur n'est revendiqué. Les retries créateurs restent interdits ; les essais de nettoyage sont manuels/bornés, sans moteur de jobs métier ni reprise live automatique.

Dettes acceptées non étendues : `braces` dev-only ; réutilisation courte du grant admin ADR 0006 ; contraintes Mac ; email simulé ; nettoyage contextes/grants ; Vercel hors périmètre ; performance synthétique ; revue UI lecteur d'écran/appareil physique non réalisée ; prérequis production incomplets. Aucun test réel avec appareil/téléphone effectué ici. Le check d’aperçu automatique Vercel reste en FAILURE, hors gates autorisées et hors périmètre ; aucune action manuelle de déploiement ou de modification Vercel effectuée.

## Rollback et arrêt

Arrêter la stack POC sans supprimer son volume ; résoudre toute obligation avant purge. Garder les credentials synthétiques nécessaires au nettoyage. Retirer workflow/zone POC et SDK/lockfile par revert des commits du lot si demandé. Aucune migration Tony à inverser, aucun numéro, coût, callback public ou secret fournisseur à révoquer. Une restauration ne rejoue jamais automatiquement une création.

**Arrêt après LOCAL_FAKE. La Gate 1 reste ouverte. Aucun PROVIDER_TEST/LIVE_POC, Lot 6, fusion, déploiement ou ressource externe avant le deuxième feu vert humain explicite.**
