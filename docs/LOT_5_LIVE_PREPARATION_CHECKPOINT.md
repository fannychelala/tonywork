# Lot 5 — Checkpoint de préparation LIVE_POC sans effet

Date : 5 octobre 2026. **Préparation technique vérifiée ; autorisation d’effets réels toujours absente. Gate 1 ouverte.**

Commit technique initial validé : `5407cd6a072dd4fb6ddf8be018b90c4a9c9f74cd`. Commit technique du préflight local sans effet : `f8ffc9d69f3dcdadd15f81f565fb54e665636134`, branche `lot-5/live-preparation`. [PR 17 en brouillon](https://github.com/fannychelala/tonywork/pull/17), aucune fusion.

## Autorisations et limites

LOCAL_FAKE validé humainement. Préparation LIVE sans effet uniquement. Le compte dédié a depuis été créé par l’utilisatrice ; aucune ressource fournisseur n’a été créée par l’agent. Clé LIVE dans l’application, numéro, callback public, tunnel actif, appel/SMS/audio et coût restent interdits. Deux décisions explicitement acceptées : plan de contrôle administratif US1 seulement pour une future acquisition/routage IE1 ; remplacement du scanner réseau global par des contrôles transitifs distincts LOCAL_FAKE/LIVE, avec mutants renforcés. Aucun credential US1 runtime ou fallback US1.

Twilio documente l’acquisition US1 puis routage IE1 : [routage régional](https://help.twilio.com/articles/49483801353115), [provisionnement et configuration](https://help.twilio.com/articles/39701463599643). Ce montage ne prouve pas une résidence UE de toutes les données administratives. [Voice régional](https://www.twilio.com/docs/global-infrastructure/regional-product-and-feature-availability) et [Messaging IE1](https://www.twilio.com/docs/global-infrastructure/messaging-eu-feature-availability) ne remplacent pas l’inspection du compte et du numéro exact.

## État des prérequis privés

Mise à jour documentaire du 9 octobre 2026 : **10 PASS / 8 BLOCKED ; Gate 1 OPEN**.

| Nº | Prérequis | État et preuve disponible |
| --- | --- | --- |
| 1 | Compte/sous-compte dédié | PASS — compte existant réservé exclusivement au POC Tony, confirmé humainement ; aucun sous-compte créé ni affirmé |
| 2 | Titulaire et MFA | PASS — titularité et connexion avec second facteur déjà réussie confirmées humainement ; configuration 2FA SMS observée dans Chrome |
| 3 | Disponibilité réelle d’un numéro français Technical Platform | BLOCKED — inventaire réel non vérifié |
| 4 | Voice + SMS bidirectionnels sur ce numéro | BLOCKED — aucun numéro ni capacités exactes vérifiés |
| 5 | Compatibilité réelle IE1 des opérations nécessaires | BLOCKED — preuve spécifique fournisseur absente |
| 6 | Matrice réelle permissions/API keys | BLOCKED — non vérifiée |
| 7 | Devis exact TTC ≤ 50 EUR | BLOCKED — devis privé absent |
| 8 | Absence d’auto-recharge et de coût récurrent imprévu | BLOCKED — non vérifiée |
| 9 | T1/T2 adultes et propriétaires de leurs téléphones | PASS — deux testeurs adultes, propriétaires de leurs téléphones, confirmés humainement le 5 octobre 2026 ; aucune identité ou coordonnée consignée |
| 10 | Consentements appel/SMS de chaque testeur | PASS — consentement de T1 et T2 pour les appels/SMS de l’essai confirmé humainement le 5 octobre 2026 ; aucune identité ou coordonnée consignée |
| 11 | Consentements audio séparés | PASS — consentement séparé de T1/T2 confirmé humainement le 5 octobre 2026 pour au maximum deux enregistrements de dix secondes, traitement Twilio et suppression selon le protocole avec persistance possible des métadonnées fournisseur ; aucune identité ou coordonnée consignée |
| 12 | Conditions/rétentions Twilio acceptées | PASS — examen et acceptation confirmés humainement le 9 octobre 2026 ; aucune acceptation contractuelle exécutée par l’agent |
| 13 | Conditions/rétentions Cloudflare acceptées | PASS — examen et acceptation confirmés humainement le 9 octobre 2026 ; aucun tunnel lancé ni acceptation contractuelle exécutée par l’agent |
| 14 | Procédure opérateur et arrêt d’urgence relus | PASS — relecture confirmée humainement le 9 octobre 2026, en réponse à cette étape ; aucune autorisation d’effet réel |
| 15 | Stockage privé des secrets prêt et testé sans fuite | PASS — Trousseau Apple choisi et FileVault confirmé humainement ; chemin synthétique Trousseau → fichiers privés `0600` → chargeur strict → conteneur isolé validé, sans valeur dans Git, environnement, commande ou logs ; tous les artefacts temporaires nettoyés |
| 16 | URL canonique à figer seulement au moment autorisé | PASS — report maintenu ; aucune URL réelle ni tunnel actif |
| 17 | Isolation spécifique du déploiement LIVE | BLOCKED — MacBook retenu et Docker installé ; refus LIVE → PostgreSQL Tony, Tony → PostgreSQL POC LIVE, absence de credential Tony et egress fournisseur entièrement fermé prouvés. La politique permettant uniquement les destinations fournisseur nécessaires n’est pas encore conçue/validée ; l’activer exige un composant réseau ou une décision distincte |
| 18 | Manifeste privé complet et daté | BLOCKED — incomplet ; aucune valeur secrète ou PII reproduite ici |

La confirmation humaine « oui » répond explicitement aux trois points demandés : titularité, compte exclusivement dédié et connexion MFA déjà réussie. L’inspection Chrome a seulement constaté une configuration 2FA SMS et un champ téléphone renseigné, sans reproduire sa valeur. L’agent n’a ni exécuté de challenge MFA, ni envoyé de code, ni modifié de réglage. Cette attestation n’est pas une vérification indépendante d’identité légale.

L’utilisatrice confirme également le 5 octobre 2026 la présence de deux testeurs adultes propriétaires de leurs téléphones, désignés uniquement T1/T2. Cette confirmation couvre le prérequis 9, sans attester leur consentement appel/SMS ou audio.

Une confirmation humaine distincte du 5 octobre 2026 atteste le consentement appel/SMS obtenu pour T1 et T2 dans le cadre de l’essai prévu (prérequis 10). Elle ne couvre ni le consentement audio, ni l’autorisation finale d’exécuter le LIVE_POC. Une confirmation humaine ultérieure, distincte, du 5 octobre 2026 atteste le consentement audio séparé reçu pour T1/T2 dans les limites expliquées : deux enregistrements maximum de dix secondes, traitement Twilio et suppression selon le protocole, avec persistance possible des métadonnées fournisseur (prérequis 11). Cette attestation ne vaut pas autorisation de déclencher un enregistrement.

Les confirmations du 5 octobre ne valent ni acceptation des conditions, ni validation du budget, des permissions ou de la région, ni autorisation d’effets réels. L’examen et l’acceptation des conditions et rétentions Twilio et Cloudflare font l’objet d’une confirmation humaine distincte le 9 octobre 2026, en réponse à l’étape demandée. Cette attestation ne vaut pas autorisation de paiement, de création de ressource, de tunnel ou d’exécution du LIVE_POC. Aucun BLOCKED n’est remplacé par une fixture ou une documentation publique. Aucun code modifié pour cette mise à jour ; les résultats techniques ci-dessous restent ceux du commit précédemment validé.

## Décisions réellement implémentées

### Contrôles Docker locaux synthétiques — 9 octobre 2026

Exécutés après installation, sans modification de code/configuration/tests, sans credential fournisseur, sans mode LIVE ni tunnel :

| Commande réellement exécutée | Résultat |
| --- | --- |
| `docker compose up --build -d --wait app worker`, via `python3 -c` injectant un `BETTER_AUTH_SECRET` aléatoire local en mémoire | Première tentative échouée : helper `docker-credential-desktop` absent du PATH du processus. Relance avec PATH Docker explicite réussie ; build Next/TypeScript, migrations et healthchecks réussis |
| `docker compose -f experiments/telephony-poc/compose.yml up --build -d --wait` | Même première erreur de PATH ; relance avec `/Applications/Docker.app/Contents/Resources/bin` dans le PATH réussie ; POC et PostgreSQL sains |
| `node experiments/telephony-poc/network-check.mjs` | `BIDIRECTIONAL_NETWORK_AND_CREDENTIAL_ISOLATION_OK` : refus TCP POC → PostgreSQL Tony et Tony → PostgreSQL POC, absence de réseau/volume partagé et de credentials croisés vérifiée, réseau POC interne et egress `api.twilio.com:443` refusé |
| `curl --fail --silent --show-error --output /dev/null --write-out '%{http_code}\n' http://127.0.0.1:3000/readiness` | HTTP exactement 200 après migrations Tony |
| `docker compose -f experiments/telephony-poc/compose.yml exec -T poc pnpm exec tsx experiments/telephony-poc/main.ts execute 00000000-0000-4000-8000-000000000001 CALL --confirm-synthetic` | `POC_OK`, effet FakeTelephonyProvider uniquement ; aucun appel fournisseur |
| `docker compose -f experiments/telephony-poc/compose.yml exec -T poc node experiments/telephony-poc/restart-proof.mjs before` | `SYNTHETIC_RECEIPT_COMMITTED` ; signature synthétique et HTTP 204, une opération/un reçu |
| `docker compose -f experiments/telephony-poc/compose.yml down` puis `up -d --wait`, sans `-v` | Serveur et PostgreSQL recréés sains avec volume conservé |
| `docker compose -f experiments/telephony-poc/compose.yml exec -T poc node experiments/telephony-poc/restart-proof.mjs after` | `SYNTHETIC_REPLAY_DEDUPLICATED_AFTER_FULL_RESTART` ; HTTP 204, une opération/un reçu après rejeu |
| `docker compose -f experiments/telephony-poc/compose.yml down` puis `docker compose down` | Arrêt propre des deux stacks, sans suppression des volumes |
| `docker ps -q` et `docker volume ls --format '{{.Name}}'`, lus par Python avec rapport booléen | Zéro conteneur en cours ; volumes Tony et POC conservés |

Les commandes Docker utilisent le PATH officiel seulement pour leurs processus, sans modification de profil shell. Les inspections Compose Tony utilisent une valeur synthétique pour résoudre la variable obligatoire, sans récupérer ni afficher le secret de session créé au démarrage. Aucun `.env` généré. L’unique correction est le PATH des commandes : aucun assertion/test assoupli, aucun changement du lockfile, aucun contournement de RLS. Le contexte de build Tony était volumineux (environ 898 MB), et le premier build/export ARM64 a été lent ; aucune mesure de performance LIVE n’en est déduite. Avertissement OpenSSL lors de l’installation des dépendances dans l’image POC, sans échec du serveur fake ; ne démontre aucune compatibilité Prisma dans le POC, qui ne l’utilise pas.

Ces preuves concernent exclusivement LOCAL_FAKE. Elles ne prouvent pas l’egress restreint d’un processus LIVE ni la transmission Trousseau → processus LIVE : les prérequis 15 et 17 restent BLOCKED. Les suites SQL/HTTP/E2E complètes n’ont pas été relancées pendant ce contrôle ciblé ; leurs résultats historiques restent distincts. Compteur inchangé : 9 PASS / 9 BLOCKED, Gate 1 OPEN. Aucun secret, donnée réelle ou ressource fournisseur utilisé ; aucune fusion ou production.

### Installation Docker autorisée — 9 octobre 2026

Autorisation humaine explicite d’installer et démarrer Docker Desktop. `uname -m` confirme Apple Silicon (`arm64`), `sw_vers -productVersion` retourne 26.5.1. Téléchargement officiel `https://desktop.docker.com/mac/main/arm64/Docker.dmg` par `curl --fail --location` dans `/private/tmp/tony-Docker-arm64.dmg`, montage par `hdiutil attach`, vérification `codesign --verify --deep --strict` réussie, copie `ditto` dans `/Applications/Docker.app`. Aucun flag d’acceptation automatique de licence employé. Application 4.94.0 ; commandes embarquées `docker --version` et `docker compose version` réussies : CLI 29.8.2 et Compose v5.5.1. Le PATH n’a pas été modifié.

Tentatives d’ouverture via contrôle natif bloquées par les autorisations macOS puis un timeout ; aucun écran de licence accepté par l’agent. `docker info --format '{{.ServerVersion}}'` dans le sandbox refuse l’accès au socket ; la vérification hors sandbox finit par réussir et retourne 29.8.2 : moteur effectivement démarré et joignable. Aucun conteneur, stack, secret fournisseur ou tunnel lancé par l’agent. Les preuves LIVE réseau/transmission restent BLOCKED ; compteur inchangé 9 PASS / 9 BLOCKED.

### Préflight local MacBook — 9 octobre 2026

L’utilisatrice retient son MacBook pour l’essai, sans Vercel. Vérifications sans démarrage de service : `command -v docker`, `docker compose version` et `docker info --format '{{.ServerVersion}}'` échouent, Docker absent du PATH ; les emplacements `/Applications/Docker.app`, `/Applications/OrbStack.app`, `/usr/local/bin/docker` et `/opt/homebrew/bin/docker` ne sont pas présents. `command -v cloudflared` ne trouve pas de binaire dans le PATH ; cela ne contredit pas la vérification historique du binaire temporaire. Aucun logiciel installé, aucun tunnel lancé.

Lecture de `experiments/telephony-poc/compose.yml` : dispositif LOCAL_FAKE uniquement, réseau `internal: true`, PostgreSQL expérimental publié sur loopback, aucun port HTTP publié, credentials synthétiques. Cette configuration n’est pas une preuve d’egress LIVE limité et ne doit pas être convertie implicitement en configuration LIVE. Lecture du dossier d’autorisation : transfert privé prévu hors arguments CLI et hors fichiers du dépôt, mécanisme non branché. Lecture de `live-config.ts` : verrou `FINAL_LIVE_AUTHORIZATION_REQUIRED` toujours présent. Aucun secret chargé, aucun serveur ou cluster démarré, aucun test réseau LIVE exécuté. Les prérequis 15 et 17 restent BLOCKED ; compteur 9 PASS / 9 BLOCKED. L’installation et la disponibilité de Docker sont nécessaires pour poursuivre les contrôles de conteneurs locaux ; une éventuelle configuration LIVE nécessite un cadrage et une autorisation distincts avant modification du code.

### Vérification opérationnelle du Trousseau — 9 octobre 2026

Contrôle local sans credential fournisseur ni modification applicative : un script `python3 -c` a généré une valeur synthétique en mémoire et appelé `/usr/bin/security add-generic-password` avec un service de test unique. La commande a retourné un échec ; aucune création réussie n’a été confirmée, la récupération et la suppression conditionnelles n’ont donc pas été exécutées. Seuls les booléens de résultat ont été affichés ; aucune valeur synthétique n’a été écrite dans le projet ou reproduite dans les sorties. Le diagnostic distinct `/usr/bin/security default-keychain -d user`, exécuté via Python avec sortie capturée et expurgée, a réussi : un Trousseau par défaut est disponible, mais la cause de l’échec d’écriture n’est pas établie. Aucune protection du Trousseau n’a été modifiée ou contournée.

FileVault est confirmé par l’utilisatrice, sans vérification indépendante de son état. Ce contrôle ne démontre ni la transmission privée au processus LIVE ni l’absence globale de fuite ; le prérequis 15 reste BLOCKED. Aucun secret LIVE créé, chargé ou utilisé. Le compteur reste 9 PASS / 9 BLOCKED.

Reprise du 9 octobre 2026 : le diagnostic expurgé de `security add-generic-password` retourne « Unable to obtain authorization for this operation » (code de sortie 152). Le même test synthétique exécuté après autorisation système hors sandbox réussit : création, récupération exacte en mémoire et suppression de la seule entrée synthétique (code d’écriture 0). Aucun déverrouillage, modification d’ACL ou affaiblissement de protection effectué ; aucune autre entrée lue. La restriction d’exécution est donc levée pour ce test, sans conclure à un Trousseau verrouillé. Les commandes `security add-generic-password`, `find-generic-password -w` et `delete-generic-password` sont exécutées par `python3 -c`, avec sorties capturées ; seuls les booléens et codes de retour sont affichés. La valeur synthétique transite temporairement dans les arguments du sous-processus d’écriture : ce test ne valide pas une méthode de transmission de credentials réels. Aucune valeur écrite dans le projet, aucun credential Twilio utilisé. Le chemin de transmission vers le processus/déploiement LIVE reste non testé ; prérequis 15 toujours BLOCKED, compteur inchangé.

Contrôle complémentaire du 9 octobre 2026, toujours sans credential fournisseur : une nouvelle valeur synthétique est créée dans une entrée unique du Trousseau, relue en sortie capturée, écrite dans un répertoire temporaire sous forme de fichier mode `0600`, puis montée en lecture seule à `/run/secrets/twilio` dans un conteneur jetable `node:24-bookworm-slim`. Le conteneur fonctionne sans réseau (`NetworkMode=none`), en lecture seule et sous l’UID/GID local. L’inspection Docker confirme que la valeur et son empreinte sont absentes de `Config.Env` et `Config.Cmd`, que le montage est en lecture seule et que la valeur lue dans le conteneur possède l’empreinte attendue. Seule l’empreinte SHA-256 est retournée par le conteneur ; elle n’est pas un secret. Conteneur, fichier, répertoire temporaire et entrée du Trousseau sont ensuite supprimés, chacun avec preuve booléenne positive. La première tentative de ce contrôle a échoué avant création du conteneur, car `docker-credential-desktop` manquait dans le PATH du sous-processus ; ses artefacts Trousseau/fichier ont été nettoyés. La relance avec le répertoire officiel Docker dans le PATH réussit entièrement.

Cette preuve générique est désormais complétée par le chargeur POC LIVE strict et son préflight conteneur décrits ci-dessous. Le prérequis 15 passe à PASS. Le verrou final reste actif et empêche toujours le chargement lors d’une tentative de démarrage LIVE réelle.

### Chargeur privé et préflight LIVE sans effet — commit `f8ffc9d69f3dcdadd15f81f565fb54e665636134`

Le chargeur ne lit que cinq chemins absolus fixes sous `/run/tony-poc` : un manifeste sans secrets ni URL SQL et quatre fichiers secrets distincts. Chaque fichier doit être régulier, appartenir à l’UID du processus, avoir exactement le mode `0400` ou `0600`, respecter une taille bornée et ne pas être un lien symbolique. Le descripteur est ouvert avec `O_NOFOLLOW`, puis inode, device, UID, mode et taille sont revérifiés avant lecture. Les retours d’erreur sont réduits à `INVALID_PRIVATE_FILE_SET`, sans chemin ni valeur privée.

`live-entry.ts` branche ce chargeur sur l’entrée préparée, mais `startPreparedLive` conserve le verrou inconditionnel `FINAL_LIVE_AUTHORIZATION_REQUIRED` avant l’appel du chargeur, la construction SDK, SQL, l’écoute HTTP ou le tunnel. `live-preflight.ts` valide les mêmes fichiers dans le conteneur sans importer provider, transport, serveur, tunnel ou listener ; ce graphe est vérifié transitivement par test.

La stack `compose.live-preparation.yml` est distincte de Tony et de LOCAL_FAKE. Elle ne publie aucun port, monte uniquement les cinq fichiers en lecture seule, utilise un root filesystem en lecture seule, `/tmp` en mémoire, `cap_drop: ALL`, `no-new-privileges` et un réseau Docker `internal: true`. Le contrôle exécuté avec valeurs exclusivement synthétiques confirme : zéro secret dans l’environnement, la commande, la configuration ou les logs ; aucun montage privé côté PostgreSQL ; aucun réseau/volume partagé ; refus TCP LIVE → PostgreSQL Tony et Tony → PostgreSQL POC LIVE ; refus d’egress vers les endpoints Twilio. Les fichiers temporaires et conteneurs sont supprimés après preuve, les volumes PostgreSQL restent conservés.

Cette preuve ferme le prérequis 15. Le prérequis 17 reste BLOCKED : le réseau de préparation est volontairement **deny-all**. Autoriser seulement Twilio IE1 et Cloudflare tout en refusant tout autre egress nécessite une politique ou un composant réseau supplémentaire qui n’a pas été approuvé. Aucun proxy, sidecar, pare-feu applicatif ou dépendance n’est ajouté silencieusement.


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

À terme uniquement après ultime accord : opérateur MFA provisionne/routage administratif US1 sans credential US1 runtime ; vérifier Voice et SMS IE1 séparément, permissions restreintes, devis et consentements. Quick Tunnel vers loopback 4316 avec service fermé aux admissions pendant l’attribution d’URL ; figer ensuite l’origine canonique dans le manifeste privé avant callbacks et ouverture. Aucune URL inventée considérée comme réelle. Aucun endpoint administratif public ni fichier secret/log publié ; stockage privé chiffré, transmission locale hors Git/CI/chat. Le chargeur privé est branché derrière le verrou final et ne peut pas être atteint par l’entrée LIVE tant que ce verrou subsiste. Avant achat, relire devis TTC/change/frais et conditions ; réserve interne seule ne garantit pas la facture 50 EUR.

En fin d’essai ou incident : fermer admissions, arrêter appels connus et traiter UNKNOWN en Console, arrêter/supprimer audio et prouver média absent, conserver les obligations inconclusives, retirer callbacks, arrêter tunnel, libérer numéro et révoquer clés/token conformément au dossier. Toutes ces actions restent interdites maintenant.

### Préparation privée : partiellement confirmée

Compte dédié, titularité, connexion MFA, présence de T1/T2 adultes propriétaires de leurs téléphones et consentements appel/SMS et audio séparés sont confirmés selon les sources distinguées ci-dessus. La relecture de la procédure opérateur et de l’arrêt d’urgence est confirmée humainement le 9 octobre 2026. L’examen et l’acceptation des conditions et rétentions Twilio/Cloudflare sont confirmés séparément le même jour. Le stockage privé local et sa transmission au chargeur sont validés avec des valeurs synthétiques. Inventaire Technical Platform français Voice+SMS, compatibilité IE1 exacte, permissions et limite d’appel du compte, devis TTC exact, désactivation de l’auto-recharge, egress LIVE restreint aux seules destinations nécessaires et manifeste privé complet restent **non confirmés**. Les fixtures ne remplacent aucune de ces preuves. Aucun secret, SID réel ou PII consigné dans ce document. Ne pas activer le LIVE tant que ces preuves et l’ultime feu vert humain manquent. Gate 1 ouverte.

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
| `pnpm exec vitest run --config experiments/telephony-poc/tests/unit.config.ts` | 202/202 local, onze suites sans SQL |
| `pnpm exec vitest run --config experiments/telephony-poc/vitest.config.ts` | 265/265 local : 202 hors SQL + 37 PostgreSQL LOCAL_FAKE + 26 PostgreSQL LIVE synthétique |
| `pnpm test:integration` | 89/89 PostgreSQL Tony local et CI ; RLS, privilèges, cross-tenant et withTenant conservés |
| `pnpm test:e2e` | 34/34 Chromium desktop/mobile local et CI ; Chromium 153 / Playwright 1.63 installé localement après le premier constat d’absence du binaire |
| `pnpm exec playwright test tests/e2e/shell-ui.spec.ts --repeat-each=3 --retries=0 --output=test-results/focus-stability` | 6/6 local et CI, sans retry |
| `pnpm audit --prod --audit-level=high` | Aucune vulnérabilité connue local et CI |
| `pnpm local:up` | Tentative locale échouée : `docker: command not found` ; succès en CI |
| Tony : `docker compose up -d --wait app worker`, `curl --fail`, assertion HTTP exactement 200, arrêt/redémarrage sans suppression volume | Succès local et CI ; readiness 200 avant/après, sonde persistante exactement une fois, sonde retirée et arrêt confirmé |
| POC : `docker compose -f experiments/telephony-poc/compose.yml up --build -d --wait`, `node experiments/telephony-poc/network-check.mjs`, `restart-proof.mjs before/after`, `down` puis `up -d --wait`, arrêt final | Succès CI ; isolation réseau/credentials bidirectionnelle LOCAL_FAKE, déduplication après restart serveur+PG, volume conservé, deux stacks arrêtées |
| `docker compose -f experiments/telephony-poc/compose.live-preparation.yml up --build -d --wait` puis `node experiments/telephony-poc/live-preparation-network-check.mjs` | Succès local avec fichiers exclusivement synthétiques : préflight et PostgreSQL sains, `LIVE_PREPARATION_DENY_ALL_ISOLATION_OK`, zéro port/egress/log/secret exposé, refus réseau bidirectionnel avec Tony, arrêt propre |
| `psql ...:5545/tony_poc -v ON_ERROR_STOP=1 -f experiments/telephony-poc/sql/001-poc.sql` | CI cluster LOCAL_FAKE ; identifiants synthétiques uniquement |
| Même initialisation 001 sur cluster CI `:5556`, puis beforeAll applique 002 avec compte inventé | Succès CI atomique, distinct du registre fake/Tony |
| GitHub CodeQL + Dependency Review | Deux jobs Security réussis |
| `curl` release publique cloudflared, `shasum -a 256` archive et executable via `tar -xOf`, puis `cloudflared --version` | Empreintes vérifiées, version 2026.9.3 ; aucun lancement de tunnel |
| `git diff --check`, commits/push branche, `gh pr create --draft`, `gh run view --json/--log`, `gh run watch --exit-status` | Exécutés ; PR attachée à la conversation, aucune fusion |

### Workflows vérifiés sur le checkpoint `5dd0142`

- [CI Tony — push](https://github.com/fannychelala/tonywork/actions/runs/37937662272) et [pull_request](https://github.com/fannychelala/tonywork/actions/runs/37937668838) : validate + docker **success** ; régressions Tony et smoke Docker confirmés.
- [POC — push](https://github.com/fannychelala/tonywork/actions/runs/37937662244) et [pull_request](https://github.com/fannychelala/tonywork/actions/runs/37937668924) : sql-http + network **success** ; 265 tests et isolation LOCAL_FAKE confirmés.
- [Security](https://github.com/fannychelala/tonywork/actions/runs/37937668999) : CodeQL + Dependency Review **success**.

Aucun succès local ou CI n’est présenté comme une preuve de trafic réel fournisseur. Docker Desktop 4.94.0, PostgreSQL 18 et Chromium Playwright ont aussi été validés sur le MacBook le 9 octobre 2026. Les tests HTTP POC locaux utilisent exclusivement loopback et signatures inventées.

## Preuves de sécurité ajoutées

Fixtures/négatifs avant branchement : contrat fermé, mauvaises région/compte/catégorie/champs inconnus/secrets absents, testeurs dupliqués ou sans consentement, URL non canonique/proxy, cinq routes signées/non signées, corps dupliqués/invalides/surdimensionnés, cookies/organizationId sans autorisation, refus d’endpoints supplémentaires. Graphes transitifs complets, alias SDK/fetch, imports imbriqués/dynamiques/produit détectés. Aucun chargement secret/SDK/SQL/écoute/tunnel avant verrou. Préflight fournisseur synthétique : compte, PN, numéro et booléens Voice/SMS exactement attendus, erreurs refusées avant effet ; même contrôle serveur/CLI. Métadonnées d’un format inattendu restent inconclusives même si le média est absent.

26 tests LIVE sur **vrai PostgreSQL, effets entièrement synthétiques** : exactement deux tables, rôles restreints et DDL/DELETE/SET ROLE refusés, compte/campagne/parent incorrects refusés, ressource immuable, huit soumissions concurrentes avec un seul effet, quota Dial+opérateur commun, budget à huit intentions distinctes avec deux seuls effets avant plafond, refus audio avant toute réservation/effet si consentement absent, replay durable, child distinct refusé, completed parent non assimilé à réponse, UNKNOWN après timeout et zéro retry, stop durable/fenêtre, nettoyage et refus cross-slot. DELETE confirmé puis média encore accessible reste DELETE_FAILED ; reprise revérifie sans second DELETE. Audio sans SID reste bloquant ; corrélation signée après redémarrage résout l’obligation **sans réouvrir les admissions**.

Réconciliation opérateur de CALL connu : GET borné, parent/slot exacts et version optimiste. UNKNOWN sans SID ne peut pas être résolu automatiquement ; rapprochement privé manuel requis, aucune recréation. Arrêt ferme les admissions avant appels connus et nettoie même si l’arrêt REST échoue ; panne SQL du watcher ferme le serveur.

## Corrections, risques et divergences

Corrections : types stricts réponse média/bindings AST et méthodes SDK minuscules ; distinction checksum archive/exécutable cloudflared ; plafonds plus faibles respectés ; origine canonique sans slash final ; alias fetch détecté ; preuve DELETE conservée et réponse inattendue de métadonnées refusée ; vérification exacte du numéro/capacités avant serveur et commande opérateur ; reprise d’un registre arrêté sans nouvelle admission. Aucune assertion métier diminuée, aucun skip/disable/retry de test. Le seul changement d’invariant existant est la séparation du scanner **autorisée explicitement**.

Pendant la validation locale du nouveau préflight, une première suite HTTP a échoué avant assertions car le bac à sable interdisait l’ouverture de loopback (`listen EPERM`) ; la même suite hors bac à sable passe 202/202. La première suite E2E a constaté l’absence du binaire Playwright ; Chromium 153 correspondant au lockfile a été installé puis les 34 tests et six répétitions passent. Pour SQL POC, Docker Desktop n’a pas exposé le port 5545 du service Compose sur son réseau interne ; deux conteneurs PostgreSQL jetables publiés uniquement sur loopback ont reproduit le montage CI. Une première relance LIVE a rencontré une base jetable déjà migrée par l’essai précédent ; la base a été recréée fraîche puis 265/265 passent. Aucun test n’a été modifié ou assoupli pour ces incidents d’environnement.

Préparation volontairement verrouillée ; le chargeur privé est branché derrière le verrou final et ne constitue pas une autorisation opérationnelle. Les preuves Docker LIVE actuelles démontrent une isolation bidirectionnelle et un egress entièrement fermé. **Avant activation LIVE, définir et faire valider une politique qui n’autorise que les destinations Twilio IE1 et Cloudflare nécessaires**, sans ouvrir un egress général. Aucun tunnel public réalisé. Une clé régionale déclarée dans une fixture n’est pas une preuve de permissions/région réelle.

Le plafond interne n’est pas un plafond opposable à la facturation fournisseur ; aucun devis exact n’est connu. Le replay TwiML ne garantit pas une seule exécution Dial fournisseur. La durée d’appel très courte et les permissions Restricted doivent être effectivement supportées par le compte IE1 ; sinon nouvel arrêt humain, sans fallback, nouvelle clé plus large ou second numéro silencieux. Nettoyage inconclusif/UNKNOWN restent bloquants. Aucune audio véritable et aucune preuve de qualité/suppression fournisseur réelle ; Gate audio/Gate 1 non franchies.

Dettes inchangées : braces dev-only, grant admin court ADR 0006, contraintes Mac, email simulé, nettoyage global des contextes/grants Tony, Vercel hors périmètre, performances synthétiques, revue lecteur d’écran/appareil physique et prérequis production non finalisés. Aucun élargissement du grant admin. Aucun changement Lot 6.

**Arrêt après préparation sans effet. Aucun PROVIDER_TEST/LIVE_POC réel, ressource, coût, fusion ou production sans ultime feu vert humain et preuves privées complètes.**
