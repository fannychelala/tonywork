# Lot 5 — Checkpoint préalable de préparation LIVE_POC

Date : 5 octobre 2026. Statut actuel : **US1 administratif validé humainement ; préparation partielle, évolution du contrôle de frontière à valider**. Gate 1 ouverte. Aucun effet réel autorisé/exécuté. Les sections initiales ci-dessous décrivent le premier arrêt ; leur état historique ne constitue pas l’état actuel de la préparation.

## Autorisation reçue et motif de l’arrêt

La préparation technique et les vérifications sans effet ont été autorisées. Le dossier [LIVE_POC](LOT_5_LIVE_POC_AUTHORIZATION.md) est validé comme protocole, avec préférence IE1 et refus de tout fallback US1 implicite. L’instruction humaine impose : « Si un prérequis diffère du dossier […] US1 nécessaire […] arrête-toi et demande une nouvelle validation ».

La documentation officielle Twilio **How to Route a Twilio Phone Number to AU1 or IE1 Region**, consultée le 5 octobre, indique que les numéros ne peuvent être achetés que via US1, puis routés vers IE1 après achat. Elle recommande d’attendre jusqu’à une minute avant le changement de région pour permettre la réplication. [Source Twilio](https://help.twilio.com/articles/49483801353115).

Le guide **Unable to Configure Webhooks or Number Properties via a Custom Front-End Integration** décrit également l’achat et le premier routage sur l’API par défaut, puis l’usage d’endpoints et credentials régionaux pour la configuration après routage. [Source Twilio](https://help.twilio.com/articles/39701463599643).

Il s’agit d’une nécessité **administrative de provisionnement US1**, pas d’une preuve que Voice/SMS doivent fonctionner en US1. La compatibilité effective du numéro Technical Platform choisi avec IE1 reste à établir. Aucun numéro n’a été recherché dans un compte privé ou acheté ; aucune possibilité d’inventaire n’est présentée comme confirmée.

## Modification proposée pour validation — non implémentée

Autoriser explicitement la séparation suivante dans la préparation technique et le futur protocole opérateur :

1. Achat éventuel du seul numéro autorisé via le plan de contrôle US1, puis routage administratif vers IE1, **uniquement après le futur feu vert autorisant les ressources et coûts**.
2. Pendant la période initiale/réplication : aucun callback public, aucune instruction Dial/enregistrement, aucun test entrant/sortant/SMS ; vérifier séparément le routage Voice et Messaging avant ouverture.
3. Opérations d’essai Voice/SMS/audio exclusivement via IE1 et ses credentials si la compatibilité complète est confirmée ; aucun fallback automatique US1.
4. Provisionnement/routage opérateur de préférence manuel dans la Console MFA : pas de credential US1 dans le processus d’essai. Vérifier également les régions/permissions requises pour la libération, sans les supposer identiques à celles du trafic.
5. Documenter les données administratives du numéro, justificatifs et facturation traitées/conservées en US1 ; ne pas présenter ce montage comme une résidence exclusivement UE de toutes les données.

Cette proposition n’autorise aucun achat, clé, routage, callback ou effet maintenant. Elle n’élargit ni le pays, ni le nombre de numéros, ni le budget, ni les surfaces HTTP. Si le trafic ne peut pas rester en IE1, nouvel arrêt pour validation distincte.

## État des preuves du checkpoint

| Élément demandé | État réel à ce checkpoint |
| --- | --- |
| Commit de préparation LIVE | **Aucun** : aucun code LIVE implémenté ; HEAD inchangé `123110b8aaac73724d6a7f92e6ddf7ad6de0d698` |
| Tests/gates de préparation | Non exécutés : arrêt avant modification applicative ; les résultats LOCAL_FAKE acceptés par revue humaine ne sont pas de nouvelles preuves LIVE |
| Compte/sous-compte et MFA | Non confirmés ; aucune session Console Twilio accessible dans les surfaces de navigateur inspectées |
| Numéro Technical Platform Voice/SMS disponible | Non confirmé ; documentation publique seulement, aucun inventaire privé consulté |
| Compatibilité IE1 effective | Non confirmée pour un numéro ; Voice et SMS IE1 documentés, achat US1 identifié |
| Débit exact ≤ 50 EUR TTC | Non établi ; aucun devis privé ni financement consulté/exécuté |
| Consentements appel/SMS et audio | Non confirmés ; aucune identité/coordonnée collectée |
| Conditions/rétentions Twilio et Cloudflare acceptées | Non confirmées ; la validation du protocole n’est pas la preuve de l’acceptation privée par les participants |
| Procédure opérateur finale | À compléter après décision régionale et vérifications privées ; arrêt/nettoyage du dossier conservés |
| Manifeste privé complet | Non constitué ; aucune donnée réelle ni aucun secret stocké |
| Effets externes | Aucun compte, sous-compte, clé, numéro, coût, tunnel, callback, appel, SMS ou enregistrement créé/modifié |

Les pages publiques documentent Voice et SMS en IE1 ; elles ne remplacent pas la vérification d’éligibilité du numéro et du compte. [Disponibilité régionale](https://www.twilio.com/docs/global-infrastructure/regional-product-and-feature-availability), [Messaging IE1](https://www.twilio.com/docs/global-infrastructure/messaging-eu-feature-availability).

## Actions réellement effectuées

Lecture du code expérimental, de sa migration, de ses tests de sécurité, du brief §129–130, du plan et de l’ADR 0010 ; consultation publique des documents Twilio ; inventaire des surfaces de navigateur sans inspection de compte privé. Commandes de lecture/inventaire : `pwd`, `rg --files`, `rg -n`, `cat`, `sed`, `git status --short`, `git rev-parse HEAD` ; contrôle documentaire `git diff --check` et contrôle du nouveau fichier hors index.

Seul ce checkpoint documentaire a été ajouté pendant cette préparation. Le dossier d’autorisation précédemment rédigé demeure hors index ; `output/` préexistant reste intact. Aucun commit/push/fusion/déploiement effectué.

**Décision initiale résolue : l’utilisateur a répondu « oui » à la proposition d’usage administratif US1, essais maintenus en IE1 et sans credential US1 dans le runtime. Cet accord n’autorise toujours aucun achat ni effet réel.**

## Reprise après accord US1 — configuration et tests négatifs

Fichiers ajoutés : `experiments/telephony-poc/live-config.ts` et `experiments/telephony-poc/tests/live-preparation.test.ts`. La configuration préparatoire est distincte de `parseConfig`, qui demeure exclusivement LOCAL_FAKE. Aucun serveur ou SDK live n’est branché.

Le contrat préparatoire est Zod strict : IE1/Dublin, France/Technical Platform, Voice/SMS, origine canonique Quick Tunnel sans credentials/query/chemin/port alternatif, format account/number SID, cluster expérimental exclusivement, fenêtre exacte, montants entiers EUR et plafonds. Champs inconnus et configuration incomplète rejetés ; erreurs génériques sans données entrantes. Aucun champ secret, téléphone ou activation n’est accepté. `assertLiveEffectsAuthorized` refuse systématiquement toute activation ; aucune variable/CLI/configuration ne peut lever ce verrou.

Les fixtures sont inventées ; elles ne prouvent pas qu’un SID existe, qu’un numéro est compatible, qu’un consentement est acquis ou qu’un budget fournisseur est garanti. Les vérifications privées et la validation des secrets au futur démarrage restent à faire, sans en lire/créer/utiliser maintenant.

Ajout de la nouvelle suite à `tests/unit.config.ts` **sans retirer de suite existante**. Tests écrits avant le module. Aucun test ou assertion LOCAL_FAKE/Tony n’a été supprimé ou modifié.

## Incompatibilité précise à résoudre avant le transport

Le test existant `entire POC runtime import graph is isolated from product and network clients`, dans `experiments/telephony-poc/tests/behavior.test.ts`, traite l’ensemble des fichiers runtime à la racine POC comme dépourvu de client réseau. Sa liste d’imports autorisés exclut notamment `node:https` et son assertion AST interdit `twilio(...)` et `fetch(...)`, sans distinction de mode.

Un transport SDK officiel et une sonde HTTPS streaming sans accumulation d’audio introduisent précisément ces capacités, même si le démarrage LIVE demeure verrouillé. Garder cette assertion globale et implémenter un véritable transport sont incompatibles. Renommer un constructeur, déplacer des fichiers hors de sa collecte, utiliser une extension non inspectée ou masquer un import exploiterait les limites du scanner : aucune de ces méthodes n’est utilisée.

La consigne humaine de ne pas réduire/assouplir les tests impose de faire valider explicitement l’évolution de cette invariant de portée. **Le transport, le serveur LIVE et la sonde réseau ne sont pas encore implémentés ; aucun résultat de préparation complète n’est annoncé.**

### Proposition concrète de contrôles, à approuver avant modification

1. Conserver intégralement les assertions d’absence de client réseau pour le graphe transitif LOCAL_FAKE depuis `main.ts`, pas seulement une collecte de fichiers à la racine. Toute arête vers un module LIVE, vers le produit ou vers un constructeur SDK réseau doit échouer ; traiter les alias d’import et les sous-répertoires pour fermer les failles du scanner actuel.
2. Garder le refus CRM/Prisma/Better Auth/withTenant/scoring pour **les deux graphes**, ainsi que les tests de configuration fake et toutes les autres assertions existantes.
3. Ajouter un contrôle LIVE distinct : réseau fournisseur seulement dans le transport isolé, hôtes IE1 fixes, pas de credential/runtime US1, aucun import produit, pas de retry créateur, redirection média refusée et média jamais accumulé/conservé.
4. Ajouter des tests d’activation prouvant que la phase préparatoire échoue **avant** chargement de secret, construction SDK, connexion SQL ou écoute/exposition. Manifeste complet, variable d’environnement, flag CLI et faux accord ne doivent pas déverrouiller le processus.
5. Ajouter des fixtures/mutants négatifs qui introduisent un client réseau dans LOCAL_FAKE, un import produit dans LIVE, un alias de constructeur SDK ou un import dynamique : chacun doit être détecté. Aucun skip, retry de test ou retrait des cas SQL/HTTP/E2E existants.

Cette proposition change la portée de l’interdiction réseau pour le seul futur mode LIVE autorisé ; elle préserve l’interdiction LOCAL_FAKE et étend les preuves de frontière. Elle reste **documentaire, non appliquée** jusqu’à validation explicite.

## Contrôles réellement exécutés à la reprise

Runtime Node/pnpm fourni par l’environnement, aucune installation/dépendance ajoutée.

| Commande | Résultat |
| --- | --- |
| `pnpm exec vitest run --config experiments/telephony-poc/tests/unit.config.ts` | **100/100**, quatre fichiers ; 42 contrôles POC sans SQL conservés et 58 nouveaux contrôles préparatoires |
| `pnpm lint` | Succès |
| `pnpm typecheck` | Succès ; génération Prisma existante sans modification de schéma |
| `pnpm test` | **57/57 Tony**, neuf fichiers |
| `pnpm build` | Succès ; aucune nouvelle route produit |
| `pnpm audit --prod` | Aucune vulnérabilité connue |

SQL POC/Tony, HTTP avec vrai PostgreSQL, E2E/focus, Docker, CI/CodeQL/Dependency Review ne sont **pas rerun ni annoncés validés** à ce checkpoint partiel ; ils restent bloquants pour la préparation complète après résolution du contrôle de frontière. Les validations LOCAL_FAKE acceptées antérieurement ne sont pas recyclées en preuves LIVE.

Compte/sous-compte/MFA, inventaire, devis, consentements et acceptations privées restent non confirmés. Aucun compte fournisseur inspecté, aucune donnée réelle collectée, aucun tunnel ni effet exécuté. Pas de fusion, publication ou production.

**Nouvelle décision demandée : autoriser la séparation explicite des contrôles réseau LOCAL_FAKE/LIVE décrite ci-dessus, sans contourner l’ancien scanner ni relâcher la frontière du fake ou l’isolation produit.**
