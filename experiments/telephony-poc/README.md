# LOCAL_FAKE uniquement

Aucune Gate 1 réelle validée. Aucun credential/provider test/live, numéro, appel/SMS/voix réel ou tunnel autorisé.

Exécution de référence : `docker compose -f experiments/telephony-poc/compose.yml up --build -d --wait`. Réseau Docker interne distinct de Tony, aucune publication HTTP et PostgreSQL POC sur loopback 5545 uniquement. Ne pas lancer le processus avec le `.env` Tony ; aucune variable Twilio/auth/Tony SQL acceptée. Le serveur écoute seulement loopback, port 4315, à l'intérieur du container.

CLI locale dans le container :

```
docker compose -f experiments/telephony-poc/compose.yml exec -T poc pnpm exec tsx experiments/telephony-poc/main.ts execute 00000000-0000-4000-8000-000000000001 CALL --confirm-synthetic
docker compose -f experiments/telephony-poc/compose.yml exec -T poc pnpm exec tsx experiments/telephony-poc/main.ts cleanup
```

Kinds CALL/SMS/RECORD/NUMBER, identifiant UUID unique et destinataires opaques synthetic-a/b. Aucun numéro ni texte SMS libre dans la CLI. Une intention existe durablement avant effet, pas de retry du même UUID. UNKNOWN sans SID exige une réconciliation opérateur et ne peut pas être recréé automatiquement. Réservations/crash consomment le quota. Quotas de campagne : un NUMBER, cinq effets par autre type. Campagne fixe synthétique : ne pas réinitialiser son volume pour contourner une limite.

Les cinq POST expérimentaux exigent une signature Twilio calculée sous la clé synthétique fixe et l'URL canonique http://127.0.0.1:4315, sans confiance dans Host/proxy/cookies. L'événement doit correspondre à une ressource déjà enregistrée. Les réponses Voice/Dial se limitent à Hangup ; forwarding réel non implémenté à ce niveau. Aucun webhook n'appelle REST ni le CRM.

SDK serveur twilio 6.1.2 (MIT, Node >=20, contrôlé sous Node 24), validateur officiel. L'adaptateur traduit les opérations REST et les preuves audio sur un transport local injecté fermé LOCAL_FAKE ; aucun client SDK REST ni réseau Twilio ne peut être construit. Le futur branchement REST/provider exige la seconde validation humaine et des tests supplémentaires : il n'est pas présenté comme validé par ce POC local.

Le fake audio produit exclusivement des preuves synthétiques. DELETED exige DELETE confirmé, providerDeleted true ou non exposé (null), média non disponible et contrôle authentifié. Métadonnées conservées possibles ; aucune promesse d'effacement physique. Trois essais maximum et échéance quinze minutes, blocage RECORD si obligation pendante/échouée. Reprise au démarrage, contrôle toutes les deux secondes et arrêt ; un nettoyage inconclusif ferme le serveur avec alerte technique et exit non nul ; erreur CLI/cleanup = exit non nul. Pas d'octet audio ni métadonnée personnelle.

Tests locaux sans PostgreSQL : `pnpm exec vitest run --config experiments/telephony-poc/tests/unit.config.ts`.
Tests PostgreSQL/HTTP réels : `pnpm exec vitest run --config experiments/telephony-poc/vitest.config.ts` avec PostgreSQL POC initialisé. Aucun skip si SQL indisponible.
`node experiments/telephony-poc/network-check.mjs` nécessite les deux stacks Docker ; prouve absence de réseau/credential/volume partagé et refus TCP bidirectionnel / egress Twilio.

Arrêt : `docker compose -f experiments/telephony-poc/compose.yml down` sans -v. Conserver registre tant que nettoyage non résolu. Purge privée des données synthétiques sous sept jours après clôture, par rôle hors runtime. Aucun déploiement/fusion/ressource externe. Provider_TEST et LIVE_POC restent à cadrer/autoriser pour toute exécution.

## Préparation LIVE verrouillée

La préparation technique sans effet est autorisée, pas son exécution réelle. Voir `docs/LOT_5_LIVE_PREPARATION_CHECKPOINT.md` et ADR 0010. Les modules `live-*` n’entrent jamais dans le graphe LOCAL_FAKE. Aucun flag ne lève le verrou final avant secrets/SDK/SQL/écoute/tunnel. `live-entry.ts` possède un chargeur de fichiers privés strict, mais le verrou final s’exécute avant ce chargeur et interdit toujours le démarrage réel.

Le préflight Docker sans effet utilise `compose.live-preparation.yml`. Il exige un répertoire privé hors dépôt contenant exactement `private/binding.json` sans secret ni URL SQL, puis `secrets/database-url`, `secrets/api-key`, `secrets/api-secret` et `secrets/auth-token`, tous appartenant à l’UID du processus et en mode `0400` ou `0600`. Ces fichiers sont montés en lecture seule ; aucune valeur ne passe par l’environnement ou la commande. `live-preflight.ts` vérifie le contrat sans importer provider, transport, serveur, tunnel ou listener. `live-preparation-network-check.mjs` prouve l’absence de port et de fuite, la séparation Tony/POC dans les deux sens et l’egress entièrement fermé. Cette stack ne permet donc aucun effet fournisseur ; toute future politique d’egress restreinte nécessite une validation distincte.

Les tests complets nécessitent maintenant **deux clusters POC synthétiques distincts** : 5545 reçoit 001 et conserve les suites LOCAL_FAKE ; 5556 reçoit 001 puis le beforeAll de `live-sql.test.ts` applique 002 avec un compte inventé. CI prépare les deux services. Ne jamais appliquer 002 au volume LOCAL_FAKE existant ou à Tony. Aucune migration produit. Deux tables/deux rôles inchangés ; nouvelles colonnes privées de corrélation/réservation et trigger de ressource immuable, aucun grant élargi.

Une reprise d’un registre arrêté conserve les admissions fermées : seuls rapprochement/nettoyage et callbacks signés déjà corrélables restent possibles. UNKNOWN sans SID n’autorise aucune recréation. La déduplication de TwiML ne promet pas l’exécution unique d’un Dial chez le fournisseur. Aucun succès synthétique ne ferme Gate 1.
