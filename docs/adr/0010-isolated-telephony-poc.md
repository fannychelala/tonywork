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
