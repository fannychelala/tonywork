# Lot 5 — Checkpoint de préparation LIVE_POC sans effet

Date : 5 octobre 2026. **Préparation technique vérifiée ; autorisation d’effets réels toujours absente. Gate 1 ouverte.**

Commit technique exact : `5407cd6a072dd4fb6ddf8be018b90c4a9c9f74cd`, branche `lot-5/live-preparation`. [PR 17 en brouillon](https://github.com/fannychelala/tonywork/pull/17), aucune fusion. Ce rapport est ajouté ensuite dans un commit documentaire, sans changement de code.

## Autorisations et limites

LOCAL_FAKE validé humainement. Préparation LIVE uniquement, sans compte/clé/numéro/callback/tunnel/appel/SMS/audio/coût réel. Deux décisions explicitement acceptées : plan de contrôle administratif US1 seulement pour une future acquisition/routage IE1 ; remplacement du scanner réseau global par des contrôles transitifs distincts LOCAL_FAKE/LIVE, avec mutants renforcés. Aucun credential US1 runtime ou fallback US1.

Twilio documente l’acquisition US1 puis routage IE1 : [routage régional](https://help.twilio.com/articles/49483801353115), [provisionnement et configuration](https://help.twilio.com/articles/39701463599643). Ce montage ne prouve pas une résidence UE de toutes les données administratives. [Voice régional](https://www.twilio.com/docs/global-infrastructure/regional-product-and-feature-availability) et [Messaging IE1](https://www.twilio.com/docs/global-infrastructure/messaging-eu-feature-availability) ne remplacent pas l’inspection du compte et du numéro exact.

## État des prérequis privés

| Prérequis | Preuve disponible |
| --- | --- |
| Compte/sous-compte, titulaire et MFA prêts | Non confirmé ; aucune inspection privée effectuée |
| Numéro français Technical Platform réellement disponible Voice+SMS | Non confirmé ; aucun inventaire réel consulté |
| Compatibilité IE1, permissions et limites exactes du compte/numéro | Non confirmées ; documentation et tests synthétiques seulement |
| Débit exact et total TTC sous 50 EUR | Non établi ; aucun devis privé, achat ou financement |
| T1/T2 consentement appel/SMS | Non confirmé ; aucune coordonnée réelle collectée |
| Consentement audio séparé | Non confirmé |
| Conditions/rétentions Twilio et Cloudflare acceptées | Non confirmé |
| Manifeste privé complet et procédure opérateur relue humainement | Non constitués/confirmés ; protocole ci-dessous uniquement |
| Effets réels | Aucun |

Les questions de préparation privée sont restées sans réponse. Aucun « oui » antérieur portant sur la région/scanner n’est interprété comme un consentement de testeur ou une autorisation d’effets.

## Décisions réellement implémentées


Les sections précédentes sont l’historique des deux arrêts résolus. Le transport IE1, l’admission signée, la corrélation parent/enfant, les quotas durables, la reprise audio, le serveur à cinq endpoints et l’entrée opérateur locale sont maintenant implémentés. Aucun SDK construit avec des secrets réels, aucun import ni credential PostgreSQL Tony dans ce graphe, aucun tunnel ouvert. Le verrou `FINAL_LIVE_AUTHORIZATION_REQUIRED` reste inconditionnel avant secret/SDK/SQL/écoute et avant lancement de tunnel.

### Fichiers et schéma

Tous les ajouts applicatifs restent sous `experiments/telephony-poc/` : `live-binding`, `live-provider`, `live-transport`, `live-webhook`, `http-server`, `live-server`, `live-repository`, `live-main`, `live-cli`, `live-tunnel`, `live-schema`, migration `sql/002-live-preparation.sql` et tests/fixtures associés. `live-config`, contrat `provider` et suites de contrôle sont adaptés. Workflow POC : une seconde base synthétique 5556 reçoit 001 puis 002 ; l’ancienne 5545 conserve 001 et tous les tests LOCAL_FAKE. ADR 0010 et AGENTS actualisés. Aucune table supplémentaire, aucun rôle supplémentaire, aucune dépendance npm, aucun schéma/migration Prisma Tony.

002 est atomique, pour registre POC neuf uniquement : compte/campagne exacts, FK parent dans le même registre, slot T1/T2, coûts réservés immuables, échéance audio, ressource non réaffectable. Runtime conserve uniquement SELECT/INSERT et UPDATE des colonnes de suivi déjà autorisées ; reçus append-only, pas DDL/DELETE/SET ROLE. Aucun rapprochement avec une organisation Tony et aucune prétention de preuve RLS par ce registre.

### Invariants et limites

- Signatures officielles vérifiées sur tous les champs avant projection ; URL canonique figée, jamais issue du proxy. Téléphones seulement en mémoire privée ; aucun corps SMS/audio/log brut.
- Quotas et budget interne réservés durablement sous verrou avant REST ou TwiML. UNKNOWN conserve son quota et interdit toute recréation automatique. Sans SID, rapprochement manuel fournisseur nécessaire ; audio sans SID conserve une obligation bloquante et admet seulement une corrélation signée pendant son délai.
- Replay TwiML déterministe avec une seule réservation Dial : aucune promesse d’exactly-once fournisseur ; tout second effet reste un incident Gate 1. Parent completed ne vaut pas réponse de l’enfant.
- Appels opérateur bornés au minimum de dix secondes, plafond appel et plafond audio configurés ; Dial borné et désactivé si plafond insuffisant. Compatibilité effective de ces limites fournisseur doit être confirmée avant activation.
- DELETED exige DELETE confirmé, deleted lorsqu’exposé et média irrécupérable avec authentification valide. Après DELETE confirmé, une reprise revérifie sans nouveau DELETE. Métadonnées fournisseur peuvent rester environ 40 jours ; ni effacement physique instantané ni effacement de sauvegardes affirmés. [Documentation Twilio](https://www.twilio.com/docs/voice/api/recording).
- Arrêt durable des admissions, arrêt des appels connus, nettoyage même si l’arrêt REST échoue ; opérations inconnues exigent Console/opérateur. Fermeture en incident n’efface jamais une obligation audio non résolue.

### Cloudflared et procédure future

Version 2026.9.3 Apache-2.0, [release officielle](https://github.com/cloudflare/cloudflared/releases/tag/2026.9.3). Sur macOS ARM64, SHA256 archive `587c2cfb1c230fe36c7fa7727da78be459dae028cabe8c001291999350f07095` (digest asset GitHub), exécutable extrait `5472c1a01c84bc31b3021056a73b4e5774ddddefc572124ea8fdf6c340639f32` (release notes). Linux AMD64 `77e26d8d900e0b8469f416239d14b5f296525fdf79fee6f511ef55609e3fbac2`. Téléchargement public, vérification des deux empreintes et `--version` réalisés ; **aucun tunnel démarré**. Pas de nouvelle dépendance/package installé dans Tony.

À terme uniquement après ultime accord : opérateur MFA provisionne/routage administratif US1 sans credential US1 runtime ; vérifier Voice et SMS IE1 séparément, permissions restreintes, devis et consentements. Quick Tunnel vers loopback 4316 avec service fermé aux admissions pendant l’attribution d’URL ; figer ensuite l’origine canonique dans le manifeste privé avant callbacks et ouverture. Aucune URL inventée considérée comme réelle. Aucun endpoint administratif public ni fichier secret/log publié ; stockage privé chiffré, transmission locale hors Git/CI/chat. Le chargement privé reste volontairement non branché pendant cette phase. Avant achat, relire devis TTC/change/frais et conditions ; réserve interne seule ne garantit pas la facture 50 EUR.

En fin d’essai ou incident : fermer admissions, arrêter appels connus et traiter UNKNOWN en Console, arrêter/supprimer audio et prouver média absent, conserver les obligations inconclusives, retirer callbacks, arrêter tunnel, libérer numéro et révoquer clés/token conformément au dossier. Toutes ces actions restent interdites maintenant.

### Préparation privée : non confirmée

Compte/sous-compte/titulaire/MFA, inventaire Technical Platform français Voice+SMS, compatibilité IE1 exacte, permissions et limite d’appel du compte, devis TTC exact, consentements T1/T2 appel/SMS et audio séparé, acceptation conditions/rétentions, manifeste privé complet et relecture opérateur restent **non confirmés**. Les fixtures ne remplacent aucune de ces preuves. Aucun secret ni SID réel ni PII collecté. Ne pas activer le LIVE tant que ces preuves et le deuxième feu vert humain manquent. Gate 1 ouverte.

### Rollback

Revenir au commit LOCAL_FAKE validé ne modifie aucune base Tony. 002 n’est pas réversible sur un registre ayant des obligations : garder le registre privé et le chemin de nettoyage jusqu’à résolution, jamais DROP en présence d’un UNKNOWN ou d’audio non supprimé. Ici aucun registre réel ni effet fournisseur n’existe.


## Commandes réellement exécutées et résultats

Les commandes locales utilisent Node 24/pnpm fournis par l’environnement. Aucune installation npm supplémentaire.

| Commande/contrôle | Résultat réel |
| --- | --- |
| `pnpm lint` | Succès local et CI |
| `pnpm typecheck` | Succès local et CI |
| `pnpm build` | Succès local et CI ; routes Tony inchangées |
| `pnpm test` | 57/57 local et CI |
| `pnpm exec vitest run --config experiments/telephony-poc/tests/unit.config.ts` | 188/188 local, neuf suites sans SQL |
| `pnpm exec vitest run --config experiments/telephony-poc/vitest.config.ts` | 251/251 CI : 188 hors SQL + 37 PostgreSQL LOCAL_FAKE + 26 PostgreSQL LIVE synthétique |
| `pnpm test:integration` | 89/89 PostgreSQL Tony CI ; RLS, privilèges, cross-tenant et withTenant conservés |
| `pnpm test:e2e` | 34/34 Chromium desktop/mobile CI |
| `pnpm exec playwright test tests/e2e/shell-ui.spec.ts --repeat-each=3 --output=test-results/focus-stability` | 6/6 CI, sans retry |
| `pnpm audit --prod --audit-level=high` | Aucune vulnérabilité connue local et CI |
| `pnpm local:up` | Tentative locale échouée : `docker: command not found` ; succès en CI |
| Tony : `docker compose up -d --wait app worker`, `curl --fail`, assertion HTTP exactement 200, arrêt/redémarrage sans suppression volume | Succès CI ; readiness 200 avant/après, probe persistante et arrêt confirmé |
| POC : `docker compose -f experiments/telephony-poc/compose.yml up --build -d --wait`, `node experiments/telephony-poc/network-check.mjs`, `restart-proof.mjs before/after`, `down` puis `up -d --wait`, arrêt final | Succès CI ; isolation réseau/credentials bidirectionnelle LOCAL_FAKE, déduplication après restart serveur+PG, volume conservé, deux stacks arrêtées |
| `psql ...:5545/tony_poc -v ON_ERROR_STOP=1 -f experiments/telephony-poc/sql/001-poc.sql` | CI cluster LOCAL_FAKE ; identifiants synthétiques uniquement |
| Même initialisation 001 sur cluster CI `:5556`, puis beforeAll applique 002 avec compte inventé | Succès CI atomique, distinct du registre fake/Tony |
| GitHub CodeQL + Dependency Review | Deux jobs Security réussis |
| `curl` release publique cloudflared, `shasum -a 256` archive et executable via `tar -xOf`, puis `cloudflared --version` | Empreintes vérifiées, version 2026.9.3 ; aucun lancement de tunnel |
| `git diff --check`, commits/push branche, `gh pr create --draft`, `gh run view --json/--log`, `gh run watch --exit-status` | Exécutés ; PR attachée à la conversation, aucune fusion |

### Workflows vérifiés sur le commit technique

- [CI Tony](https://github.com/fannychelala/tonywork/actions/runs/37319823324) : validate + docker **success** ; 57/89/34/6 confirmés dans les logs.
- [POC](https://github.com/fannychelala/tonywork/actions/runs/37319823276) : sql-http + network **success** ; 251 tests, dont 26 tests LIVE SQL.
- [Security](https://github.com/fannychelala/tonywork/actions/runs/37319823245) : codeql + dependency-review **success**.

Aucun succès de CI n’est présenté comme une preuve de trafic réel fournisseur. Docker, PostgreSQL et Chromium validés en runners Linux ; Docker absent sur Mac, pas d’exécution locale de ces gates revendiquée. Les tests HTTP POC locaux utilisent exclusivement loopback et signatures inventées.

## Preuves de sécurité ajoutées

Fixtures/négatifs avant branchement : contrat fermé, mauvaises région/compte/catégorie/champs inconnus/secrets absents, testeurs dupliqués ou sans consentement, URL non canonique/proxy, cinq routes signées/non signées, corps dupliqués/invalides/surdimensionnés, cookies/organizationId sans autorisation, refus d’endpoints supplémentaires. Graphes transitifs complets, alias SDK/fetch, imports imbriqués/dynamiques/produit détectés. Aucun chargement secret/SDK/SQL/écoute/tunnel avant verrou. Préflight fournisseur synthétique : compte, PN, numéro et booléens Voice/SMS exactement attendus, erreurs refusées avant effet ; même contrôle serveur/CLI. Métadonnées d’un format inattendu restent inconclusives même si le média est absent.

26 tests LIVE sur **vrai PostgreSQL, effets entièrement synthétiques** : exactement deux tables, rôles restreints et DDL/DELETE/SET ROLE refusés, compte/campagne/parent incorrects refusés, ressource immuable, huit soumissions concurrentes avec un seul effet, quota Dial+opérateur commun, budget à huit intentions distinctes avec deux seuls effets avant plafond, refus audio avant toute réservation/effet si consentement absent, replay durable, child distinct refusé, completed parent non assimilé à réponse, UNKNOWN après timeout et zéro retry, stop durable/fenêtre, nettoyage et refus cross-slot. DELETE confirmé puis média encore accessible reste DELETE_FAILED ; reprise revérifie sans second DELETE. Audio sans SID reste bloquant ; corrélation signée après redémarrage résout l’obligation **sans réouvrir les admissions**.

Réconciliation opérateur de CALL connu : GET borné, parent/slot exacts et version optimiste. UNKNOWN sans SID ne peut pas être résolu automatiquement ; rapprochement privé manuel requis, aucune recréation. Arrêt ferme les admissions avant appels connus et nettoie même si l’arrêt REST échoue ; panne SQL du watcher ferme le serveur.

## Corrections, risques et divergences

Corrections : types stricts réponse média/bindings AST et méthodes SDK minuscules ; distinction checksum archive/exécutable cloudflared ; plafonds plus faibles respectés ; origine canonique sans slash final ; alias fetch détecté ; preuve DELETE conservée et réponse inattendue de métadonnées refusée ; vérification exacte du numéro/capacités avant serveur et commande opérateur ; reprise d’un registre arrêté sans nouvelle admission. Aucune assertion métier diminuée, aucun skip/disable/retry de test. Le seul changement d’invariant existant est la séparation du scanner **autorisée explicitement**.

Préparation volontairement verrouillée et chargeur privé non branché ; elle ne constitue pas une autorisation opérationnelle. Les preuves réseau Docker concernent LOCAL_FAKE. **Avant activation LIVE, vérifier le déploiement IE1 et l’isolation réseau du processus à egress Twilio contre Tony**, sans réutiliser aveuglément la preuve fake. Aucun démarrage du réseau LIVE ni tunnel public réalisé. Une clé régionale déclarée dans une fixture n’est pas une preuve de permissions/région réelle.

Le plafond interne n’est pas un plafond opposable à la facturation fournisseur ; aucun devis exact n’est connu. Le replay TwiML ne garantit pas une seule exécution Dial fournisseur. La durée d’appel très courte et les permissions Restricted doivent être effectivement supportées par le compte IE1 ; sinon nouvel arrêt humain, sans fallback, nouvelle clé plus large ou second numéro silencieux. Nettoyage inconclusif/UNKNOWN restent bloquants. Aucune audio véritable et aucune preuve de qualité/suppression fournisseur réelle ; Gate audio/Gate 1 non franchies.

Dettes inchangées : braces dev-only, grant admin court ADR 0006, contraintes Mac, email simulé, nettoyage global des contextes/grants Tony, Vercel hors périmètre, performances synthétiques, revue lecteur d’écran/appareil physique et prérequis production non finalisés. Aucun élargissement du grant admin. Aucun changement Lot 6.

**Arrêt après préparation sans effet. Aucun PROVIDER_TEST/LIVE_POC réel, ressource, coût, fusion ou production sans ultime feu vert humain et preuves privées complètes.**
