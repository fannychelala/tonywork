# ADR 0010 — POC téléphonie isolé, LOCAL_FAKE seulement

Date : 2026-10-05. Décision approuvée par revue humaine du plan Lot 5.

Le POC est un processus Node expérimental séparé du produit. Il utilise un cluster PostgreSQL distinct, deux tables techniques PocOperation/PocWebhookReceipt et les rôles tony_poc_migrator/tony_poc_runtime. Aucun identifiant, credential, volume ou réseau PostgreSQL Tony n'est partagé. Aucun import CRM/auth/withTenant/scoring. Aucune modification Prisma produit.

Seul LOCAL_FAKE est autorisé. Le mode est fermé et les clés sont synthétiques constantes : aucune configuration live/test fournisseur, réseau Twilio ou exposition publique ne peut être activée. L'adaptateur Twilio utilise un transport injecté sans réseau et le validateur officiel ; aucune signature maison. Les cinq routes webhook ne créent jamais de SMS/appel REST. La CLI réserve une intention/quota durable avant effet ; résultat ambigu UNKNOWN, jamais rejoué aveuglément.

L'audio est simulé : DELETED exige DELETE confirmé, état deleted lorsqu'exposé, média irrécupérable avec authentification valide. Métadonnées conservées par le fake reproduisent la politique fournisseur ; aucun effacement physique instantané affirmé. Nettoyage incomplet bloquant, reprise durable après restart.

Le registre ne persiste ni téléphone, SMS, corps webhook, clé, audio ni URL média. Rôles non propriétaires à privilèges ciblés, reçus append-only. L'isolation réseau est une frontière différente de la RLS tenant existante, qui reste inchangée et testée.

Conséquence : une vraie ligne reste nécessaire pour Gate 1 ; aucun succès LOCAL_FAKE ne ferme cette Gate. PROVIDER_TEST/LIVE_POC, fusion et production exigent un nouveau feu vert explicite. Les dettes des ADR antérieures, notamment ADR 0006, ne sont pas étendues.

## Autorisations ultérieures — 5 octobre 2026

LOCAL_FAKE validé humainement. Le dossier LIVE_POC et la **préparation technique sans effet** sont autorisés ; aucun credential live, numéro, callback public, tunnel actif, appel/SMS/audio, coût, fusion ou production ne l’est. L’achat administratif US1 suivi d’un routage IE1 est accepté en principe, sans credential US1 dans le processus POC et sans fallback de trafic US1 ; aucun achat/routage effectué. Voir le [checkpoint](../LOT_5_LIVE_PREPARATION_CHECKPOINT.md).

La configuration préparatoire séparée ne charge aucun secret et n’active aucun processus LIVE. Le verrou final refuse systématiquement l’activation. L’évolution du contrôle statique global « aucun client réseau POC » vers des frontières LOCAL_FAKE/LIVE distinctes est proposée pour validation humaine, pas appliquée. Aucun test existant assoupli ou retiré. Gate 1 reste ouverte.

## Préparation LIVE sans effet — décisions implémentées

La séparation de portée LOCAL_FAKE/LIVE a reçu un accord humain explicite. Le graphe transitif LOCAL_FAKE conserve le refus réseau/produit ; mutants d’alias, dépendances imbriquées et imports dynamiques ajoutés. LIVE autorise HTTPS et construction du SDK uniquement dans son transport ; hôte IE1/Dublin fixe, redirects/retry désactivés, taille REST bornée, sonde média immédiatement interrompue sans accumulateur audio. Le verrou final échoue avant chargement privé, client SDK, SQL et écoute. Il n’existe aucun flag d’activation.

Le profil SQL LIVE `002-live-preparation.sql` est atomique et réservé à un registre expérimental **neuf**, distinct du volume LOCAL_FAKE et de Tony. Il conserve exactement deux tables et deux rôles, fixe un compte validé et une campagne, ajoute corrélation parent/enfant, slot abstrait T1/T2, réservations de coût et échéance d’arrêt audio. Aucun nouveau grant runtime ; resource ne peut plus être réaffecté après liaison. Les identifiants fournisseur sont techniques mais sensibles : restent dans le registre privé, jamais dans les rapports/logs. Pas de téléphone, contenu SMS, corps webhook, secret ou audio dans SQL.

Admission entrante seulement après signature officielle et correspondance exacte aux testeurs consentants du manifeste privé. Quotas sérialisés sous verrou transactionnel avant TwiML ou REST. Parent completed ne prouve pas Dial répondu. Un second SID enfant est refusé. Le replay restitue le même TwiML et ne réserve pas une nouvelle intention ; **ceci ne garantit pas qu’un fournisseur n’exécute jamais deux Dial**. Tout effet fournisseur supplémentaire est un incident bloquant Gate 1, avec arrêt manuel.

Les appels opérateur sont volontairement limités à dix secondes côté fournisseur, plus court que le maximum de campagne, afin de borner toute capture REST liée même après crash. Cette capacité doit être confirmée pour le compte/région avant activation. Audio exige consentements séparés et rappel audible confirmé ; DELETE 204 durable, état deleted lorsqu’exposé, média 404 avec authentification valide. Une vérification inconclusive reste bloquante. Une reprise avec DELETE déjà confirmé revérifie sans refaire DELETE. Une création sans SID attend une corrélation signée bornée, admissions fermées ; jamais de nouvelle création aveugle.

Budget interne = coûts fixes + réservations unitaires conservatrices documentées, y compris UNKNOWN. Il ne constitue pas un plafond financier fournisseur opposable : devis TTC, change, taxes et frais opérateur restent à vérifier privément sous 50 EUR. Aucun achat ni clé utilisé. Cloudflared 2026.9.3, Apache-2.0, empreinte archive GitHub et empreinte exécutable distinctes sur macOS ; aucune installation persistante ou ouverture publique. Aucun fallback US1 runtime.
