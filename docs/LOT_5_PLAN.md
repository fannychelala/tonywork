# Lot 5 — POC téléphonie Twilio / Gate 1

Statut : **cadrage proposé pour validation humaine, aucune implémentation autorisée à ce stade**.
Date : 2026-10-04. Le Lot 4 est officiellement validé par la revue humaine.

Ce document est le seul livrable de cette préparation. Il ne vaut ni autorisation de créer une ressource fournisseur, ni autorisation d'appeler, d'envoyer un SMS ou d'enregistrer quelqu'un. Aucun compte, numéro, secret, tunnel public ou abonnement n'est créé pendant le cadrage. Aucun changement applicatif, SQL, de test ou de dépendance n'est effectué.

## 1. Références relues et périmètre exact

Références : [brief complet](BRIEF.md), [constitution du dépôt](../AGENTS.md), ADR [0001](adr/0001-modular-monolith.md) à [0009](adr/0009-simulated-opportunity-engine.md), [téléphonie](TELEPHONY.md), [runbooks](RUNBOOKS.md), [revue Lot 4](LOT_4_REVIEW.md). Les sections 43–47, 52–53, 76, 78–95, 100–106 et surtout 129–134 du brief définissent ce POC.

Le Lot 5 démontre le comportement réel du fournisseur : attribution/libération d'un numéro de test, appel entrant, webhook signé, identification correcte des états d'appel et d'un appel manqué, SMS de test, appel sortant de test, enregistrement très court et suppression vérifiée. La Gate 1 exige une vraie ligne recevant un appel et remontant correctement son état. Les autres capacités du POC doivent également disposer de preuves avant de déclarer le lot terminé.

La branche et la zone expérimentales restent séparées du produit. Aucun écran, bouton Appeler, statistique produit, contact, opportunité, task, transcript, formulaire prospect ou scoring réel n'est créé. Aucun appel métier n'est réalisé. Les logos restent réservés aux futures interfaces.

| Dans le Lot 5 | Reporté explicitement |
| --- | --- |
| Contrat `TelephonyProvider`, fake et adaptateur Twilio expérimental | Adaptateur Telnyx ou autre fournisseur |
| Scripts opérateur bornés, réponses TwiML de test et callbacks | Bouton Appeler, WebRTC, historique CRM : Lot 7 |
| Réception durable, déduplication technique, états et reprise du POC | Appel manqué → SMS automatique → formulaire → CRM, jobs métier et Gate 2 : Lot 6 |
| Un SMS explicitement lancé vers un testeur autorisé | Messages commerciaux, lien signé et formulaire prospect : Lot 6 |
| Enregistrement consenti très court, arrêt, suppression et suivi d'échec | Transcription, AIProvider, transcript, pipeline audio et monitoring produit : Lot 8 |
| Journal technique minimal de corrélation | Extraction conversationnelle : Lot 9 ; scoring connecté : Lot 10 |
| Limites locales de sécurité et budget des essais | Billing, quotas produit, onboarding, back-office, production |

## 2. Trois niveaux de preuve, sans équivalence implicite

| Niveau | Réseau / données / ressources | Ce qu'il prouve |
| --- | --- | --- |
| LOCAL_FAKE, défaut | Aucun accès fournisseur ; secrets factices, numéros et événements synthétiques ; PostgreSQL expérimental local | Contrats, validation, signatures avec clé de test, reprises, concurrence et limitation des effets |
| PROVIDER_TEST, optionnel | API Twilio avec **test credentials préexistants si disponibles**, fournis après autorisation ; aucune utilisation de live credentials | Compatibilité des seules opérations REST supportées et erreurs simulées ; pas un appel réel ni la Gate 1 |
| LIVE_POC, désactivé par défaut | Compte/sous-compte dédié autorisé, un numéro, téléphones de testeurs consentants, endpoint HTTPS public temporaire, éventuels frais | Livraison réelle, états réels, callbacks, enregistrement et suppression observée |

Twilio précise que les test credentials ne joignent pas de vrais numéros, ne produisent pas les callbacks de statut des appels/SMS et ne couvrent qu'une partie des API. Sa documentation indique aussi que la nouvelle console ne permet pas d'en créer ; ceux de l'ancienne console peuvent rester utilisables. Ce niveau sera **non disponible**, et non simulé sous une étiquette fournisseur, si aucun accès compatible n'existe. Un compte trial avec des appels réels appartient à LIVE_POC. [Source Twilio](https://www.twilio.com/docs/iam/test-credentials).

Les fixtures versionnées restent exclusivement synthétiques. Les coordonnées/voix réelles de testeurs restent des données personnelles même pour un essai ; leur traitement nécessite l'autorisation distincte décrite ci-dessous. Aucune donnée client/prospect réelle, conversation professionnelle ou donnée métier n'est admise.

## 3. Architecture expérimentale proposée à valider

### Isolation du produit

Proposition : un processus Node expérimental sous `experiments/telephony-poc/`, utilisant le runtime existant, un port différent et un **cluster PostgreSQL expérimental distinct**. Il ne s'agit pas d'un nouveau service de production. La stack Tony habituelle, son schéma Prisma, ses migrations, ses quatre tables CRM, ses rôles et son worker restent inchangés.

Le processus POC ne reçoit aucune URL SQL Tony, session Better Auth, clé de grant administrateur ou credential `tony_auth`/`tony_app`/`tony_migrator`. Il n'importe ni repository CRM, ni auth, ni moteur de scoring. Le réseau du POC ne permet pas d'atteindre PostgreSQL Tony. Le compose expérimental doit démontrer cette séparation, sans montage du volume Tony ni chargement de son `.env`.

Un seul compte fournisseur et une seule campagne de test sont actifs par base expérimentale. Cette base ne contient **aucune donnée tenantée du produit**. Elle ne prétend pas utiliser la RLS Tony comme preuve d'autorisation du fournisseur. Tout besoin de rattachement à une organisation ou de partage entre plusieurs tenants impose un nouveau cadrage avant implementation ; le routage tenant sécurisé appartient au Lot 6.

### Inventaire SQL proposé — uniquement dans le cluster expérimental

Deux tables techniques et une migration SQL explicite, atomique et indépendante sont proposées, **à approuver dans ce cadrage** :

| Table | Données nécessaires / contraintes |
| --- | --- |
| `PocOperation` | UUID local, identifiant de campagne, type d'intention opérateur, état, version de concurrence, SID fournisseur corrélé, dates UTC, référence opaque du testeur ; pour l'audio : RecordingSid, `PENDING` / `DELETED` / `DELETE_FAILED`, échéance et nombre d'essais. Unicité des identifiants d'opération et des SID corrélés par type/compte |
| `PocWebhookReceipt` | Identifiant local, compte configuré, route/type d'événement, SID ressource, SID parent si utile, statut, séquence lorsqu'elle existe, clé de déduplication, dates UTC de réception, corrélation et résultat technique. Unicité de la clé d'événement ; insertions append-only pour le runtime |

Pas de corps webhook brut, téléphone, nom, SMS libre, adresse, token, URL audio ni fichier audio dans ces tables. Les SID, horaires et références restent potentiellement réidentifiants et sont traités comme personnels. Les relations nécessaires utilisent des clés composites compte/campagne/identifiant ; aucun rattachement inter-campagne n'est accepté. Index pour recherche SID, unicité événement, opérations non terminales et échéances de suppression. Pas de table `Call`, `InboundRequest`, `Job`, `Transcript`, `UsageEvent` ou cinquième table CRM dans Tony.

Deux rôles expérimentaux distincts, sur ce seul cluster : `tony_poc_migrator` pour DDL hors runtime et `tony_poc_runtime` non propriétaire, sans superuser/BYPASSRLS/CREATEROLE/CREATEDB ni héritage privilégié. Runtime : SELECT/INSERT/UPDATE ciblés sur les opérations, SELECT/INSERT sur les reçus, aucun DELETE/TRUNCATE/DDL ; purge contrôlée hors runtime. Aucun de ces rôles n'est créé dans le cluster Tony. Les credentials sont différents de ceux du produit. Le SQL ne vérifie pas une signature Twilio : cette frontière relève de l'adaptateur HTTP ; la frontière empêchant tout accès CRM est l'isolation du cluster et des credentials. Aucun privilège produit n'est élargi.

### Providers, dépendances et fichiers envisagés

`TelephonyProvider` expose uniquement les capacités exercées : `provisionNumber`, `releaseNumber`, `makeOutboundCall`, `sendSms`, `getCall`, `startRecording`, `stopRecording`, `deleteRecording`, `verifyWebhook`. Les types internes ne dépendent pas de Twilio. `FakeTelephonyProvider` couvre les scénarios locaux ; `TwilioTelephonyProvider` traduit les DTO et erreurs, avec délais et résultats ambigus explicites.

**Une seule nouvelle dépendance est proposée : le SDK serveur officiel `twilio`**, dans le périmètre expérimental, pour le validateur officiel des signatures et les appels fournisseur. Version exacte à vérifier/verrouiller à l'implémentation avec compatibilité Node 24, licences, lockfile et audit production propre ; aucune installation aujourd'hui. Pas de bibliothèque maison de signature, SDK navigateur, provider IA, stockage objet, Redis, observabilité SaaS ou service supplémentaire. PostgreSQL, Zod et l'outillage de tests existants sont réutilisés. Si le SDK exige une dépendance directe supplémentaire ou ne satisfait pas l'audit, arrêt et nouvelle validation du choix.

Fichiers futurs indicatifs : ADR 0010 dédiée, contrat/adaptateurs/config serveur expérimentaux, fixtures et tests POC, SQL expérimental, compose/CLI expérimentaux, `.env.example` sans valeurs réelles, runbook, `docs/LOT_5_REVIEW.md`. Aucune route sous `src/app`, modification du modèle Prisma produit ou activation du worker Tony n'est prévue. L'ADR sera écrite avant le code après validation du plan ; elle ne modifiera pas les ADR 0006/0008/0009.

## 4. Ressources et autorisations externes nécessaires

Après validation du cadrage, les tests locaux peuvent être implémentés. **La validation du plan seule n'autorise pas les ressources ni les effets réels.** Avant PROVIDER_TEST ou LIVE_POC, obtenir l'accord explicite sur :

1. Le compte/sous-compte Twilio dédié et son opérateur ; aucune création automatique ni accès au compte commercial principal.
2. Le pays, les capacités Voice/SMS du numéro, la disponibilité et les éventuelles vérifications réglementaires fournisseur. Pas de portabilité d'un numéro personnel. Si un seul numéro ne satisfait pas Voice et SMS, documenter le blocage et demander validation avant un second numéro.
3. Le fournisseur de tunnel/endpoint HTTPS temporaire et son exposition exacte ; pas de Vercel ni de déploiement produit. Pas de compte/tunnel public ouvert pendant la préparation.
4. Deux numéros de testeurs au maximum, appartenant à des adultes consentants ; liste locale privée et confirmation de consentement à l'appel/SMS, distincte du consentement à l'audio. Pas de téléphone tiers, client ou numéro trouvé dans le CRM.
5. Un plafond financier explicite en euros, la fenêtre d'essai, les frais récurrents du numéro, le responsable d'arrêt et la procédure de libération. Budget absent = aucun effet payant. Les prix/disponibilités sont à vérifier au moment de cette autorisation ; aucun tarif supposé dans le plan.
6. Les credentials transmis hors Git et hors conversation/logs, les conditions d'enregistrement, de résidence et de rétention fournisseur acceptées. Aucun document d'identité dans le dépôt.

Configuration serveur proposée : mode fermé par enum, URL publique canonique HTTPS fixe, identifiant de compte attendu, SID du numéro, allowlist privée E.164, budget et limites, fenêtre d'essai, URL du PostgreSQL expérimental et rôle runtime. Pour les signatures : Auth Token du compte concerné. Pour REST : API Key SID/secret aux permissions minimales supportées ; si une opération exige un Auth Token ou une clé plus large, la capacité exacte doit être documentée et approuvée avant activation. Les test credentials restent distincts. Twilio documente séparément ces méthodes d'authentification. [Source](https://www.twilio.com/docs/usage/requests-to-twilio).

Les clés sont validées au démarrage, masquées dans les erreurs, non transmises au navigateur et exclues des artefacts CI. Aucune lecture/écriture automatique de secrets GitHub pendant ce lot. Live credentials en mode fake/test, mélange de comptes ou configuration partielle : refus de démarrer. Rotation/révocation à la fin ; pas de conservation de token comme preuve.

Limites proposées pour une campagne réelle : un numéro fournisseur, deux testeurs, dix appels entrants acceptés, cinq appels sortants et cinq SMS maximum ; appels de 60 secondes maximum, enregistrement de dix secondes maximum. Une reservation transactionnelle durable compte chaque **tentative** avant l'appel REST ; un timeout ne libère pas le quota. Deux appels entrants simultanés autorisés pour le scénario de test. SMS fixe non commercial sans lien ; aucune réponse SMS automatique. Budget et plafonds supplémentaires fournisseur activés quand disponibles. Ces limites réduisent les effets, mais ne garantissent pas l'absence de frais d'un appel entrant inconnu : webhook fermé/refusé, alertes fournisseur et libération rapide du numéro restent nécessaires.

## 5. Surfaces HTTP et autorisation

Seul le processus expérimental expose ces POST ; les chemins n'intègrent aucun `organizationId` :

| Surface proposée | Usage / frontière |
| --- | --- |
| `/poc/webhooks/twilio/voice` | Appel entrant : signature, compte/ligne/testeur autorisés, réception durable puis réponse XML TwiML bornée |
| `/poc/webhooks/twilio/dial-result` | Résultat du segment vers le téléphone testeur ; signature et corrélation au CallSid parent connu |
| `/poc/webhooks/twilio/call-status` | État d'appel/segment ; signature, compte et SID appartenant à la campagne |
| `/poc/webhooks/twilio/message-status` | Livraison du SMS ; signature et MessageSid d'une opération autorisée |
| `/poc/webhooks/twilio/recording-status` | État/enregistrement disponible ; signature et corrélation CallSid/RecordingSid connus |

Aucune API publique de création d'appel/SMS, provisionnement, téléchargement audio, lecture des reçus ou administration. Les intentions opérateur passent par une CLI locale, avec configuration privée et confirmation explicite d'effet, hors URL publique. Une session OWNER/MEMBER/PLATFORM_ADMIN Tony ne donne **aucun droit** sur ces endpoints ou la CLI. Le grant admin de l'ADR 0006 n'est ni accepté, ni créé, ni prolongé.

Les callbacks sont authentifiés par signature fournisseur puis autorisés par compte attendu, ressource corrélée et fenêtre de campagne. Une signature valide ne constitue pas une Membership. Un champ client `organizationId`, un GUC, un cookie ou un SID arbitraire ne permet jamais d'ouvrir `withTenant`. Le POC n'écrit aucun audit métier Tony et ne dispose d'aucun accès CRM.

L'absence d'Origin navigateur n'est pas un rejet automatique du webhook signé : les règles CSRF des API CRM restent intactes. Les routes webhook appliquent leur propre authentification serveur et n'acceptent pas de session comme alternative. Réponses génériques `no-store`, pas de CORS permissif, détail secret ou payload reflété. Aucun préfetch/cache/RSC n'accède au POC.

## 6. Signature, parsing et admission

Ordre obligatoire : contrôle méthode/type/taille → capture des octets reçus → décodage form sans perte/ambiguïté → vérification officielle → validation/projection DTO → autorisation compte/ressource → transaction durable/déduplication → réponse.

V1 : POST `application/x-www-form-urlencoded` uniquement ; 32 KiB maximum, 100 paramètres maximum, valeurs bornées, encodages invalides et clés répétées/ambiguës refusés, pas de multipart ou JSON implicite. Le validateur reçoit **tous** les paramètres fournisseur, avant toute projection ou suppression d'un champ inconnu. Le DTO interne est Zod strict et ne reçoit que les champs explicitement mappés ; les paramètres supplémentaires fournisseur restent bornés, non persistés et sans effet d'autorisation.

La vérification `X-Twilio-Signature` utilise l'Auth Token attendu et l'URL externe exacte configurée, avec chemin et query autorisée. Aucune reconstruction depuis un `Host`/`X-Forwarded-*` arbitraire ; aucun fallback vers HTTP/local, clé de test ou signature optionnelle. Le protocole Twilio est HMAC-SHA1 et le validateur officiel est requis. [Source sécurité Twilio](https://www.twilio.com/docs/usage/security).

L'URL publique n'accepte pas de query dynamique de routage ; si une query fixe est nécessaire, elle fait partie de la configuration signée. Les fragments d'override de connexion ne font pas partie de la signature ; un header de retry n'est pas une identité métier suffisante. [Source retries](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides).

Signature absente/incorrecte ou compte non autorisé : 403 sans persistance de payload ni effet ; corps invalide : 400/413/415 ; saturation : 429 ; échec SQL avant commit : 503. Callback admis durablement ou doublon connu : 204 pour les statuts ; réponse TwiML contrôlée pour Voice/Dial. Le numéro de test ne doit jamais être routé à partir d'un `To` ou d'une URL reçue : destinations fixes de l'allowlist serveur. Aucune requête vers RecordingUrl/callback URL client : SID validé et hôte API fournisseur constant, pas de redirects externes.

Limites proposées : 30 requêtes/s globales et 300/minute par ressource admise, capacité mémoire bornée ; quotas de campagne indépendants et durables. L'IP est un signal de limitation avant signature, jamais une preuve fournisseur. Pas de liste d'IP comme remplacement de signature. Tests de saturation garantissent que les callbacks légitimes ne déclenchent pas de doublons après retry ; limites ajustées uniquement sur mesures documentées, sans ouverture des droits.

## 7. Replay, ordre, idempotence et effets limités

La signature démontre l'intégrité/origine sous le secret partagé ; elle ne fournit pas à elle seule une garantie de fraîcheur universelle. Les callbacks n'ont pas tous un identifiant d'événement/timestamp signé commun. Ne pas inventer une fenêtre cryptographique à partir de l'heure locale de réception.

Clés durables spécifiques : compte + campagne + type/route + SID ressource + identité d'événement documentée. Pour les callbacks Voice disposant de `SequenceNumber`, conserver cette séquence avec le statut et détecter une collision de même identité/contenu incompatible. Pour les messages/enregistrements sans séquence, utiliser SID + statut/événement et champs techniques stables sélectionnés ; pas de numéro, contenu libre, header de retry ou heure de réception dans la clé. Versionner la normalisation. Les doublons exacts sont reconnus après redémarrage par une contrainte unique SQL ; une collision incompatible ne modifie pas un événement accepté et déclenche une erreur technique sans effet.

Un statut retardé peut être conservé mais ne fait pas régresser un état terminal ; les transitions permises sont explicites par type. Pas d'ordre fondé sur l'arrivée. La séquence Voice ordonne les événements émis, dont l'arrivée peut être désordonnée. [Source Call resource](https://www.twilio.com/docs/voice/api/call-resource). Une incohérence exige une lecture fournisseur bornée du SID connu, jamais une récupération aveugle d'URL du payload. SID inconnu pour un callback de suivi : refus sans création implicite d'opération. Après fermeture de campagne, aucune nouvelle opération ; reçus de suppression attendus traités seulement pendant la fenêtre de nettoyage prévue.

La transaction de réception contient l'insertion unique et les changements techniques permis. Aucun appel REST dans la transaction ou avant commit. Un webhook ne déclenche **jamais** automatiquement un SMS, contact ou appel sortant REST dans ce lot. La CLI réserve durablement un identifiant d'intention unique et un quota avant l'effet ; concurrence/rejeu du même identifiant refusent une seconde exécution.

Un timeout REST après possible acceptation fournisseur produit `UNKNOWN`, pas un retry aveugle. Réconciliation par SID lorsqu'il est connu ; sinon contrôle opérateur et recherche fournisseur limitée. Sans preuve de non-exécution, ne pas recréer l'effet. Les retries ne sont automatiques que pour lectures ou suppression idempotente/reconciliée ; backoff borné, trois essais maximum, erreurs persistées sans payload sensible. Pas de moteur de jobs générique anticipé.

Les réponses TwiML à une requête Voice répétée sont déterministes par CallSid. La déduplication de réception ne prouve pas une exécution exactement une fois par le réseau téléphonique : une réponse perdue/rejouée peut avoir des effets de contrôle d'appel. Le POC doit vérifier les segments effectivement créés et leur nombre dans les essais retry ; tout redial non maîtrisé est un blocage documenté, pas une assertion assouplie. Les effets restent limités au testeur fixe et à la durée bornée.

## 8. États d'appel, SMS et audio : preuves attendues

Pour un appel entrant, distinguer le segment vers Twilio du segment `<Dial>` vers le testeur. Un appel parent `completed` ne prouve pas que le testeur a décroché. Le POC conserve les SID parent/enfant et le résultat Dial ; `busy`, `no-answer`, `failed`, `canceled` ne sont pas fusionnés arbitrairement. Le raccrochage très court et un résultat incomplet restent explicites. Messagerie vocale et réponse humaine ne sont pas distinguées sans preuve fournisseur ; pas de classification humaine inventée.

Scénarios réels : décroché, absence de réponse, occupation si reproductible, raccrochage court, deux appels simultanés, même testeur deux fois. Chaque scénario a un attendu préparé, une chronologie UTC, les états fournisseur, les reçus locaux et les ambiguïtés observées. Un SMS accepté par REST n'est pas déclaré livré ; tester callback et lecture de statut. Aucun déclenchement automatique depuis « manqué ».

Audio désactivé par défaut et uniquement sur un appel de test avec consentement préalable explicite de tous les participants, rappel audible avant début, phrases synthétiques sans information personnelle et arrêt borné. Ne pas enregistrer un appelant entrant inconnu ni une messagerie personnelle. Commencer par une opération sortante contrôlée où les deux parties sont identifiées. Pas de transcription, copie locale, lecture publique ou téléchargement proposé. Si la validation nécessite exceptionnellement d'écouter le fichier, nouveau accord et protocole privé avant tout téléchargement.

Créer une obligation durable de suppression dès l'intention d'enregistrer, même si le RecordingSid arrive tard. Suivre `PENDING`/`DELETED`/`DELETE_FAILED` sans état silencieux. Après arrêt et disponibilité, demander DELETE via SID. La preuve de suppression exige cumulativement :

1. Succès confirmé du DELETE fournisseur (HTTP 204 attendu), conservé comme preuve technique expurgée ; un timeout ne constitue pas une confirmation.
2. Vérification de l'état fournisseur attendu après suppression : `deleted` lorsque cette information est disponible, en incluant les métadonnées supprimées dans la lecture API si nécessaire. Si l'état n'est pas exposé, documenter précisément cette limite ; l'absence de métadonnées ne remplace pas les autres preuves.
3. Vérification que le média n'est plus récupérable, via son endpoint fournisseur contrôlé et une authentification valide. Un échec d'authentification, un timeout ou une panne réseau ne prouvent pas cette impossibilité. La sonde ne conserve aucun octet audio et interrompt la récupération si un média reste servi : contrôle échoué.
4. Mention explicite dans le rapport : les métadonnées peuvent rester visibles dans la Console et l'API pendant environ 40 jours selon la politique Twilio. Leur présence n'est pas un échec de suppression du média si les preuves précédentes sont satisfaites.
5. Distinction explicite entre suppression du média, disparition des métadonnées et effacement physique des sauvegardes fournisseur, sans garantie d'effacement physique instantané.

Ces critères suivent la [documentation Twilio Recording](https://www.twilio.com/docs/voice/api/recording). Le statut local `DELETED` signifie que ces preuves de suppression du média sont satisfaites ; il ne signifie pas que toutes les métadonnées fournisseur ont disparu. La sonde de non-récupérabilité fait partie du contrôle de nettoyage, sans téléchargement conservé, écoute ni nouvelle surface d'accès audio.

Objectif POC : suppression déclenchée immédiatement après l'essai, vérifiée dans les **15 minutes suivant sa fin** selon les critères ci-dessus. Un échec après trois tentatives ou à l'échéance produit `DELETE_FAILED`, alerte visible à l'opérateur, exit non nul et blocage de nouveaux essais audio. Un processus tué puis relancé retrouve les obligations et reprend le nettoyage. L'arrêt ferme les admissions, attend les transactions, signale les obligations non résolues et laisse les credentials de nettoyage disponibles jusqu'à vérification. Politique contractuelle/résidence et limites d'effacement physique à confirmer avant LIVE_POC et à mentionner au rapport. **Un média encore récupérable, un DELETE non confirmé ou une obligation de nettoyage non résolue bloque la Gate audio et la validation Gate 1/lot complet**, même si le statut indique `deleted`. La conservation attendue des seules métadonnées n'impose pas d'attendre leur disparition pour clôturer le nettoyage.

## 9. Confidentialité, rétention et exploitation

| Donnée | Règle proposée pour le POC |
| --- | --- |
| Téléphones/consentements | Configuration opérateur privée, aucune fixture Git ; supprimés localement sous 24 h après clôture/nettoyage, révocation des accès |
| Corps webhook/signature/Auth Token | Traitement transitoire en mémoire, jamais dans SQL/logs/traces/rapports ; aucune capture réseau brute publiée |
| Audio fournisseur | Très court et consenti ; suppression immédiate, échéance 15 min ; échecs bloquants |
| Registre technique/SID/horaires | Conservation privée maximale sept jours après clôture, purge hors runtime ; obligations audio non résolues interdisent la clôture normale et nécessitent traitement incident |
| Logs | Codes techniques, UUID local de corrélation, compte pseudonymisé ; pas de téléphone, URL audio, SMS, header, secret ou stack contenant le corps ; rotation/purge sous sept jours |
| Preuves de revue | Résultats agrégés et chronologies expurgées ; aucun SID réel, numéro, compte réel, voix ou capture console personnelle dans Git/CI |

Le fournisseur peut conserver métadonnées d'appel/SMS et données de facturation selon ses propres règles ; une purge locale ne les efface pas. Les durées/régions et modalités de suppression côté Twilio doivent être vérifiées et acceptées pour LIVE_POC. Pas de déclaration de conformité RGPD ou de consentement implicite. L'information des testeurs et la revue juridique des conditions d'enregistrement sont des prérequis du volet réel, pas une tâche d'implémentation produit.

Secrets restreints au processus et aux personnes autorisées, Console protégée par MFA, tunnel sans journalisation de body, dumps privés chiffrés si exceptionnellement nécessaires ; aucun dump d'essai dans le dépôt. Aucun backup audio ni transfert à IA. L'exposition d'un numéro/tunnel peut attirer des appels non sollicités : rejet sans enregistrement/forwarding, aucun SMS de réponse, coûts surveillés. Coupure : fermer tunnel, retirer callbacks, arrêter les effets puis les appels actifs, résoudre/supprimer les enregistrements, libérer le numéro après validation opérateur et révoquer les clés. Arrêter le serveur seul n'arrête pas nécessairement un appel ou une facturation fournisseur.

## 10. Tests définis avant code — tous bloquants dans leur niveau

### Fixtures et tests unitaires/négatifs

- Fixtures synthétiques indépendantes par route : signé valide, signature absente/invalide, mauvais secret/compte, URL/query/schéma falsifiés, paramètres ajoutés/altérés, forwarded headers malveillants, clés répétées, encodage invalide, corps trop gros, types/MIME/méthodes invalides. Vecteurs de signature de référence indépendants du wrapper testé.
- Validateur officiel sur intégralité des paramètres ; projection Zod stricte, SID/type/statut/E.164 bornés, aucune propriété inconnue propagée ni mutation des entrées.
- Aucun downgrade live→fake/test ; aucune destination hors allowlist, numéro d'urgence/premium/international non explicitement autorisé, URL externe ou secret dans une erreur. Si la catégorisation d'un numéro est incertaine, refus avant effet.
- Doublons séquentiels/concurrents, replay ancien, restart, collisions, désordre, callback tardif, SID inconnu, mauvais parent, état terminal non régressif, campagne fermée. Tester séparément limites d'admission et limites d'effets.
- Appel répondu/manqué/court/simultané, même numéro répété ; SMS échoué et statut non final ; indisponibilité/timeouts avant et après possible acceptation ; absence de retry créateur aveugle.
- Suppression audio : DELETE confirmé, état `deleted` disponible et média irrécupérable malgré des métadonnées encore visibles → succès ; état non exposé → limite documentée avec les autres preuves obligatoires. DELETE non confirmé, statut incompatible disponible, média toujours servi, erreur d'authentification ou contrôle réseau inconclusif → aucun passage en `DELETED`, obligation non résolue et Gate bloquée. Tester aussi callback tardif, décès du processus avant/après création et DELETE, reprise, échéance dépassée et alerte. Obligation sans SID réconciliée, jamais perdue.

### Intégration PostgreSQL expérimentale directe

- Base fraîche, migration atomique, contraintes/FK/index/unicités, SQL de mauvaise campagne rejeté ; aucun privilège DDL/TRUNCATE/DELETE reçus runtime, propriétaire différent, aucun BYPASSRLS/escalade/accès aux credentials produit.
- Deux connexions : même événement en parallèle → un reçu ; même intention → une réservation d'effet ; rollback de réception → aucune confirmation 2xx ; reprise après crash → déduplication conservée.
- Concurrence sur quotas et version, échec de transaction sans masquage de cause, audio non terminal retrouvé après restart, purge réservée au rôle hors runtime.
- Depuis réseau/credentials POC : accès au cluster Tony impossible ; depuis `tony_app`/`tony_auth` : accès au cluster POC impossible. Contrôler absence de montage/URL/identifiants partagés. Ne pas présenter ces tests comme des politiques RLS tenant nouvelles.

### HTTP expérimental et anti-fuite

- Les cinq POST testés avec serveur local fake ; aucun appel fournisseur lors d'une admission refusée, aucun cookie Tony requis ou suffisant, Origin/Host forgés ne rétablissent aucun droit.
- Un webhook falsifié avec tenant B, une session A ou un grant admin ne touche aucune ligne CRM A/B. Capturer compteurs et état SQL avant/après ; vérifier absence de chemin d'import CRM/auth et de connexion Tony.
- Vérifier refus des paramètres de routage tenant et comptes/ressources étrangères, 403 générique, no-store, absence de body/secrets/PII dans réponses/logs/artefacts ; pas d'API opérateur accessible depuis le tunnel.
- Réponse rapide uniquement après commit, 503 en panne SQL, comportement après perte de réponse, charge bornée et refus 429 ; mesurer p50/p95/max de réception locale (objectif POC p95 < 500 ms hors fournisseur), sans fabriquer un SLA production.

### Tests fournisseur et manuels

- PROVIDER_TEST seulement si disponible et autorisé : opérations supportées et erreurs documentées. Aucun test fake ne reçoit l'étiquette « fournisseur réel » ; absence de callbacks/enregistrement avec test credentials explicitement notée.
- LIVE_POC après accord distinct : numéro/capacités/config, entrant répondu/manqué/court/simultané, callbacks signés, SMS réellement reçu par testeur, sortant reçu, enregistrement borné puis DELETE confirmé, état post-suppression vérifié lorsqu'il est disponible et média non récupérable. Consigner la persistance possible des métadonnées et les limites d'effacement physique. Valider URL derrière tunnel et réponses/réessais fournisseur effectivement observés.
- Rejeu signé **synthétique** et erreurs destructrices dans fake/local ; ne pas injecter de panne susceptible de multiplier de vrais appels/SMS. Réessais réels contrôlés seulement sous budgets et autorisation.
- Comparer la chronologie fournisseur et le registre expurgé ; distinguer comportement documenté, réellement observé et non vérifiable. État ambigu, audio non supprimé ou impossibilité d'essai réel = Gate 1 non validée, jamais remplacée par un mock.

### Non-régression Tony et E2E

Conserver sans réduction les suites existantes : **57 unitaires, 89 PostgreSQL, 34 E2E desktop/mobile et six répétitions focus** constituent la référence du Lot 4, pas des résultats rerun pendant cette préparation. Ajouter les tests POC à ces suites, jamais remplacer leur couverture.

Maintenir SQL/RLS ENABLE+FORCE, permissions OWNER/MEMBER/PLATFORM_ADMIN, accès direct A/B, contextes falsifiés/absents, sessions révoquées, audit append-only, concurrence CRM, timezone/DST, et régression `withTenant` laissant Prisma rollbacker après erreur SQL. Aucun usage migrateur/auth pour contourner un contrôle runtime. Garder les fixtures historiques immuables du scoring 1.0.0 et leur calibration technique non validée commercialement.

E2E produit : tous les parcours Lots 2/3, confidentialité DOM/HTML/RSC/réseau/prefetch, historique/déconnexion, clavier/focus/mobile/320 px. Aucune UI POC nouvelle : ne pas inventer un E2E « appel → opportunité » du Lot 6. Vérifier que l'exécution du POC n'introduit aucun lien, payload ou donnée privée dans le shell Tony. Revue manuelle du protocole opérateur et des téléphones réelle distincte des E2E Chromium.

## 11. Ordre d'implémentation proposé après validation

1. ADR 0010, fixtures synthétiques et assertions négatives, inventaire précis des ressources et du protocole de nettoyage.
2. Contrat/config stricte/fake, isolation du processus, SQL expérimental et tests de privilèges/concurrence/reprise.
3. Réception HTTP, validateur officiel, déduplication/états et tests HTTP avant tout branchement fournisseur.
4. Adaptateur Twilio et CLI bornée, tests mock de transport, quotas/timeout `UNKNOWN`, suppression et arrêt ; aucun live credential.
5. Gates locales/CI et non-régression produit complètes. Revue intermédiaire des preuves de fermeture des frontières.
6. Accord explicite des ressources/effets, puis PROVIDER_TEST si disponible et LIVE_POC contrôlé. Si l'accord ou l'environnement manque, rapport de blocage et Gate 1 ouverte.
7. Nettoyage vérifié, rapport `LOT_5_REVIEW.md`, arrêt pour revue humaine. Aucun Lot 6, fusion ou production.

## 12. Gates et commandes à consigner dans la revue future

Commandes existantes à exécuter à l'implémentation : `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm build`, `pnpm audit --prod`, `pnpm local:up`, `pnpm local:down`. Les commandes dédiées au POC seront nommées et documentées lors de l'implémentation ; elles n'existent pas encore et ne sont pas déclarées exécutées ici.

Docker : base migrée, `/readiness` HTTP 200 avant/après restart, conservation du volume et des données synthétiques, arrêt propre sans suppression du volume ; contrôle séparé du volume POC et des obligations audio. Tests PostgreSQL réels et Chromium complets sur environnement disponible, Linux CI si les contraintes Mac persistent. Aucun contrôle sauté déclaré passant.

CI : lint/typecheck/unit/intégration PostgreSQL/HTTP/E2E, six répétitions focus sans retry, build, audit production, Docker smoke, CodeQL et Dependency Review sur le commit exact. Le fake ne dépend d'aucun secret CI ni réseau Twilio. Les tests fournisseur ne sont pas des jobs live automatiques de PR. Aucune publication/fusion ou ressource externe n'est autorisée par cette préparation ; les résultats distants du Lot 5 restent à obtenir après autorisation correspondante.

Le rapport final distinguera commandes réellement exécutées, versions, commit/runs CI, succès/échecs/blocages, preuves synthétiques vs réelles, migrations expérimentales, SDK et audit, surfaces, SQL/HTTP/A-B, idempotence et ses limites réseau, timings mesurés, consommation/coûts observés, suppression vérifiée, état des ressources, corrections, divergences et dettes. Aucun SID/credential réel dans les preuves publiques.

## 13. Risques résiduels, rollback et points de validation

Risques propres au POC : exposition temporaire publique, vol Auth Token, replay valide, doublons de contrôle TwiML, timeout REST ambigu, numéros entrants non autorisés, faux « manqué » parent/enfant, messagerie vocale, coûts inattendus, conservation fournisseur, enregistrement tardif/orphelin, processus de nettoyage interrompu. Les contrôles ci-dessus limitent ces risques ; les comportements non démontrés restent bloquants ou explicitement non validés.

Dettes antérieures conservées sans extension : `braces` dev-only, courte réutilisation du grant admin ADR 0006, contraintes Mac, email simulé, nettoyage contextes/grants, Vercel hors périmètre, performance synthétique, lecteur d'écran/appareil physique non revus pour l'UI et prérequis opérationnels production incomplets. Le POC n'y ajoute aucun droit CRM/admin ou nouvelle promesse commerciale.

Rollback : désactiver admission/effets, arrêter les appels actifs par SID si nécessaire, terminer la suppression audio selon les preuves de la section 8 avant révocation des clés, retirer callbacks/tunnel, libérer le numéro avec accord opérateur, constater l'arrêt des frais récurrents, révoquer credentials, purger données privées puis retirer la zone expérimentale. Aucune migration Tony à inverser. Ne pas supprimer le registre tant qu'une obligation fournisseur reste non résolue ; la persistance attendue des métadonnées après suppression confirmée du média reste documentée dans le rapport, sans imposer une conservation locale jusqu'à leur disparition. Une restauration de volume expérimental ne relance jamais automatiquement les appels/SMS.

**Décisions nouvelles à approuver** : processus/cluster isolés, deux tables et deux rôles SQL exclusivement expérimentaux, unique SDK `twilio`, cinq endpoints publics temporaires, CLI opérateur sans connexion au CRM, limites/rétention et protocole audio. Les créations/effets externes restent soumis à un second accord explicite avec budget, pays/numéro, endpoint, testeurs et consentements. Sans vraie ligne autorisée et preuves réelles, la Gate 1 reste ouverte et le Lot 6 ne démarre pas.

**Arrêt obligatoire après ce cadrage. Aucun code, migration, test applicatif, installation de dépendance, compte, numéro, secret, webhook public, appel, SMS, abonnement, fusion ou production n'est effectué à ce stade.**
