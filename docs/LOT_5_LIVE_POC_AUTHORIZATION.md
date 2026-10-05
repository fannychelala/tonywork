# Lot 5 — Dossier d’autorisation LIVE_POC / Gate 1

Date : 5 octobre 2026. **Proposition documentaire, LIVE_POC non autorisé.** LOCAL_FAKE est validé humainement ; Gate 1 reste ouverte. Référence du dépôt : `123110b8aaac73724d6a7f92e6ddf7ad6de0d698`.

Références : [brief §129–130](BRIEF.md), [plan Lot 5](LOT_5_PLAN.md), [ADR 0010](adr/0010-isolated-telephony-poc.md), [preuves LOCAL_FAKE](LOT_5_REVIEW.md), [restrictions du processus](../experiments/telephony-poc/README.md). Ce dossier ne modifie ni code, SQL, dépendance, configuration active ni ressource externe. Les propositions ci-dessous exigent un nouveau feu vert humain et la résolution des prérequis ; une case inconnue n’est jamais réputée approuvée.

## 1. Compte et responsabilité

Proposition : sous-compte Twilio exclusivement dédié `Tony-Lot5-LIVE-POC`, sous un compte détenu et administré par Fanny, Console protégée par MFA. L’existence d’un compte Twilio, son titulaire légal, son financement, ses restrictions trial et la possibilité d’un sous-compte **ne sont pas établis**. Aucun compte n’a été inspecté ni créé. Si aucun compte parent approprié n’existe, sa création et ses conditions devront figurer explicitement dans le feu vert, sans réutiliser un compte commercial tiers.

Fanny est proposée comme opératrice responsable du budget, des consentements et de l’arrêt ; un second adulte peut être testeur, sans accès aux credentials. Confirmer cette responsabilité avant ouverture. Aucun compte OpenAI/GitHub ne constitue une preuve d’accès Twilio.

## 2. Pays et numéro proposé

**France, un seul numéro**, temporaire et dédié, aucun portage. Candidat : catégorie française « Technical Platform », sous réserve de disponibilité réelle et d’éligibilité confirmées par Twilio. Aucun numéro précis n’est réservé ; aucun SID réel ne figure ici. Pas de remplacement implicite par un numéro étranger, un second numéro ou un sender alphanumérique.

## 3. Capacités nécessaires

Voice entrant, Voice sortant et SMS bidirectionnel sur le même numéro ; callbacks Voice/Dial/SMS/Recording ; enregistrement Voice très court puis suppression API. Aucune transcription, MMS, WhatsApp, SIP trunk, SDK navigateur, Messaging Service supplémentaire ou workflow commercial. Les SMS restent des essais manuels non commerciaux ; accepter une réponse SMS ne déclenche aucun effet. La compatibilité simultanée de ces capacités, des API et de la région choisie doit être prouvée avant attribution.

## 4. Disponibilité réglementaire : prérequis bloquant

La grille Twilio distingue les numéros locaux/nationaux Voice, les mobiles Voice/SMS réservés au P2P et les plateformes techniques Voice/SMS (`+3393903`, `+3393924`, `+3393920`). Ces dernières permettent des usages applicatifs bidirectionnels et des attributions courtes, inférieures à 72 heures. Un mobile P2P n’est donc pas un substitut approuvé pour un SMS applicatif. Les justificatifs varient avec le type de numéro et le titulaire. [Grille réglementaire France](https://www.twilio.com/en-us/guidelines/fr/regulatory).

**Stock, acceptation de cet usage expérimental, justificatifs nécessaires et tarif de cette catégorie restent non confirmés.** Ne transmettre de pièce d’identité ou de document d’entreprise qu’après autorisation, dans le canal sécurisé fournisseur, jamais dans Git, le rapport ou ce chat. Si cette catégorie est indisponible/inadaptée, arrêt et nouvelle proposition humaine ; aucune extrapolation de la grille à un inventaire effectivement achetable.

## 5. Tarifs actuels et estimation conditionnelle

Tarifs publics consultés le 5 octobre 2026, en USD, hors taxes, change, frais bancaires et éventuels suppléments ; à revérifier avant engagement.

| Poste | Repère public / hypothèse de calcul |
| --- | --- |
| Numéro local français Voice | 1,35 USD/mois ; **ce n’est pas le devis du numéro plateforme Voice/SMS proposé** |
| Entrant local | 0,0100 USD/min ; catégorie proposée à confirmer |
| Sortant mobile français | provision à 0,1603 USD/min ; certains tarifs depuis EEE affichent 0,0404 USD/min, sans supposer leur éligibilité |
| Enregistrement | 0,0025 USD/min ; stockage 0,0005 USD/min/mois |
| SMS vers France | repère 0,0798 USD/segment affiché pour numéros internationaux/alphanumériques ; **tarif plateforme française à confirmer** |
| SMS entrant | repère 0,0075 USD/segment, même réserve de catégorie |
| Tunnel temporaire | Quick Tunnel gratuit proposé ; aucun abonnement |

[Voice France](https://www.twilio.com/en-us/voice/pricing/fr), [SMS France](https://www.twilio.com/fr-fr/sms/pricing/fr), [Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

Exemple de provision d’usage, et non devis : 10 minutes entrantes + 5 minutes sortantes mobiles + 5 segments SMS sortants + 2 entrants + 2 minutes facturables d’enregistrement et un mois de stockage = `0,10 + 0,8015 + 0,399 + 0,015 + 0,005 + 0,001 = 1,3215 USD`. Les deux minutes audio provisionnent prudemment deux essais de dix secondes ; vérifier les unités réellement facturées. Ajouter le **prix mensuel exact du numéro compatible**, les suppléments et taxes. Le total ne peut pas être confirmé à partir du tarif Voice-only. Aucun prorata/remboursement de location n’est présumé après libération.

## 6. Plafond financier proposé

**50 EUR TTC maximum au total**, comprenant toute alimentation initiale du compte, location mensuelle entière, usage, tunnel, frais réglementaires éventuels, taxes et change/frais bancaires. Les crédits promotionnels ne justifient pas un dépassement. Pas d’auto-recharge, d’abonnement annexe ou de renouvellement volontaire.

Avant achat : relever le devis compatible et le montant réellement débité en euros ; réserver tous les coûts fixes et une marge pour appels indésirables et facturation retardée. Aucun financement si le montant minimal exigé dépasse 50 EUR. Alerte à 30 EUR, arrêt des nouveaux essais à 35 EUR, solde réservé à l’arrêt/nettoyage. Ces valeurs sont proposées, pas configurées. Les quotas applicatifs et alertes fournisseur ne constituent pas un plafond de facturation garanti : l’exposition PSTN et les délais de remontée peuvent encore entraîner des frais. Si ce risque ne peut pas être borné de façon acceptable, ne pas ouvrir la ligne.

## 7. Fenêtre exacte proposée

Lundi **12 octobre 2026, 14:00–16:00 Europe/Paris (12:00–14:00 UTC)**. Attribution au plus tôt à 13:30 Paris ; fin des nouveaux effets à 16:00 ; vérifications de nettoyage jusqu’à 16:15 ; libération du numéro et fermeture des accès au plus tard 16:30, sous réserve d’obligations de nettoyage non résolues. Un incident ne devient pas une prolongation d’essais ; préserver seulement les moyens de nettoyage nécessaires.

Fenêtre conditionnelle : si autorisation, conformité, consentements, devis et validation technique ne sont pas acquis avant 13:30, **annuler**, sans report automatique. Aucun rendez-vous ni automatisation n’est créé. Chaque audio doit être nettoyé immédiatement, avec son échéance propre de quinze minutes ; ne pas attendre 16:15 pour un audio créé plus tôt.

## 8. Tunnel HTTPS et exposition

Proposition : **Cloudflare Quick Tunnel**, connecteur temporaire `cloudflared`, sans domaine personnalisé ni nouveau compte Cloudflare. L’URL sera attribuée seulement à son démarrage : `https://<nom-attribué>.trycloudflare.com`. Ce placeholder n’est pas une URL active. La documentation décrit une URL aléatoire temporaire, sans garantie de disponibilité ; la limite de concurrence et l’absence de SSE ne remplacent pas les limites du POC. [Documentation Quick Tunnel](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

Avant callbacks : consigner l’origine effectivement attribuée dans un manifeste privé, verrouiller sa valeur canonique HTTPS et la présenter à l’opératrice. Un changement d’origine suspend l’essai ; jamais de reconstruction depuis Host ou headers proxy. Exposer **uniquement les cinq POST** `/poc/webhooks/twilio/{voice,dial-result,call-status,message-status,recording-status}`. Toutes autres routes/méthodes refusées ; aucun endpoint CLI, SQL, Tony, média ou administration. Pas d’inspecteur HTTP, capture de body, logs debug ni dump réseau. Cloudflare termine HTTPS et traite donc les callbacks : le tunnel n’est pas confidentiel vis-à-vis du fournisseur.

L’installation éventuelle du connecteur, son canal d’acquisition/version, le relais loopback et l’egress ciblé devront être inclus dans l’autorisation technique ultérieure. Le réseau Docker POC est aujourd’hui interne et le serveur loopback dans son container : **il n’est pas exposable en ajoutant simplement cette URL**. Aucun tunnel ni installation effectué maintenant.

## 9. Testeurs et consentement appel/SMS

Deux adultes maximum, T1/T2, propriétaires des deux téléphones privés ; aucune donnée client/prospect, tiers ou numéro premium/urgence. Fanny peut être T1. Identité, coordonnées E.164, opérateur et acceptation des éventuels frais de leur forfait restent à confirmer hors Git. Allowlist en configuration privée ; destinataires fixés côté serveur, jamais choisis par un callback ou une session Tony.

Avant tout effet : accord écrit privé, daté, pour recevoir/émettre les appels de test et recevoir au maximum cinq SMS fixes au total pendant cette fenêtre, avec information sur Twilio/Cloudflare, données traitées, rétention, coût éventuel, retrait et contact opératrice. Consentement individuel révocable sans justification ; arrêt immédiat pour le testeur concerné. Aucun numéro réel dans ce dossier ou les fixtures. L’accord appel/SMS **n’autorise pas l’enregistrement**. Pas de SMS automatique en réponse à un manqué.

## 10. Consentement audio distinct

Deux enregistrements maximum de dix secondes, sur appels sortants contrôlés seulement. Accord audio séparé préalable de tous les participants, rappel audible avant activation, phrase synthétique sans nom/information privée ; début seulement après confirmation. Aucune captation d’un entrant inconnu, messagerie vocale ou personne non consentante. Retrait/refus : aucun enregistrement, scénario non exécuté et Gate audio non validée. Pas d’écoute, transcription, copie locale ou téléchargement conservé ; une demande d’écoute nécessiterait un accord supplémentaire.

L’information explique la suppression du média et la persistance possible des métadonnées fournisseur, sans promettre l’effacement instantané des sauvegardes. Vérification des conditions juridiques applicables et de la notice de consentement avant l’essai ; ce dossier ne certifie pas une conformité globale.

## 11. Credentials REST et signature

REST : API Key SID/secret dédiés au sous-compte et à la région, aux permissions minimales réellement disponibles pour numéros, appels/arrêt, SMS/lecture, enregistrements/arrêt/lecture/suppression. Séparer la clé d’exploitation de la clé de provisionnement/libération si possible. Matrice d’opérations/permissions à vérifier avant création ; pas de fallback silencieux vers clé Standard/Main ou Auth Token REST si une restriction n’est pas supportée. [Authentification Twilio](https://www.twilio.com/docs/usage/requests-to-twilio).

Signature : Auth Token du compte/région effectivement utilisés par les callbacks, à confirmer avec la configuration régionale fournisseur. Validateur officiel du SDK verrouillé 6.1.2 sur tous les paramètres avant projection ; aucune signature maison, exception ou clé fake de secours. L’Auth Token demeure un secret puissant, même utilisé seulement pour vérifier : sa possession ne doit pas être présentée comme cryptographiquement limitée aux webhooks. [Sécurité webhook](https://www.twilio.com/docs/usage/security).

## 12. Stockage et transmission des secrets

Proposition : saisie locale par l’opératrice dans le Trousseau macOS ; transfert privé hors chat/Git si nécessaire, jamais dans une URL, argument CLI, historique terminal, `.env` du dépôt, CI ou GitHub Secrets. Injection par fichiers privés éphémères en mémoire, permissions propriétaire seul, montés dans le seul processus POC ; aucun secret dans les définitions Compose ou dumps d’environnement. Mécanisme non implémenté aujourd’hui, à valider par tests de non-fuite avant utilisation.

Ne pas partager credentials Tony/POC, compte parent/sous-compte ou mode fake/test/live. Pas de console filmée ou capture d’écran contenant des secrets. Rapport uniquement expurgé ; aucun token, téléphone réel, SID réel, body SMS/webhook ou octet audio dans SQL/logs/artefacts. Rotation/révocation après nettoyage ; un besoin de conservation pour incident est privé, borné et signalé.

## 13. Région, résidence et rétention

Préférence : **IE1 (Irlande)** pour Voice et SMS si toutes les capacités nécessaires du numéro y sont disponibles. Twilio documente Voice régional et SMS en IE1, avec configuration/credentials spécifiques ; SMS utilise l’edge Dublin. Cela ne prouve ni l’éligibilité du numéro proposé, ni que tous les flux/metadata/opérateurs PSTN restent exclusivement dans l’UE. Le choix d’un edge ne constitue pas une preuve de résidence. Aucun fallback US1 implicite : incompatibilité → arrêt et nouvelle approbation. [Disponibilité régionale](https://www.twilio.com/docs/global-infrastructure/regional-product-and-feature-availability), [Messaging IE1](https://www.twilio.com/docs/global-infrastructure/messaging-api-with-twilio-regions), [limites de résidence SMS](https://www.twilio.com/docs/global-infrastructure/sms-eu-data-residency).

Twilio : audio supprimé immédiatement selon §16 ; métadonnées Recording pouvant rester environ 40 jours ; logs Messages disponibles par défaut jusqu’à 400 jours. Les durées exactes des logs Call, sauvegardes, facturation, justificatifs réglementaires et options de purge doivent être relevées pour le compte retenu et acceptées avant ouverture, sans promesse de purge totale locale. [Suppression Voice](https://help.twilio.com/articles/360002588893-Downloading-and-Deleting-Twilio-Call-Recordings), [rétention SMS](https://help.twilio.com/articles/223181008-Twilio-SMS-message-and-traffic-storage).

Cloudflare : réseau mondial, terminaison TLS ; aucune résidence exclusivement UE ni rétention nulle affirmée. La rétention applicable aux Quick Tunnels et aux données de sécurité n’est pas établie par le guide de démarrage : confirmer les conditions applicables et les présenter aux testeurs avant utilisation. À défaut d’acceptation informée, tunnel bloqué. [Politique de confidentialité](https://www.cloudflare.com/privacypolicy/).

Local : coordonnées/consentements supprimés sous 24 h après clôture et nettoyage ; registre/SID/horaires et logs techniques privés sous sept jours, purge hors runtime. Obligations audio non résolues préservées pour incident. Preuves versionnées exclusivement agrégées/pseudonymisées, sans captures personnelles. Les téléphones/voix des testeurs sont des données personnelles, même si le contenu est synthétique.

## 14. Séquence exacte et conditions techniques préalables

**Le code actuel reste fermé LOCAL_FAKE** : transport live, configuration régionale/secrets, admission du nouvel appel entrant, corrélation parent/enfant, TwiML Dial et son quota durable, sonde média authentifiée et exposition ciblée restent à implémenter et tester après feu vert explicite. Aucun credential ne doit simplement débloquer le fake. Conserver l’isolation Tony, les deux tables/rôles POC, les quotas, l’état UNKNOWN et toutes les gates ; aucun import CRM/auth/withTenant/scoring. Si une nouvelle table, dépendance applicative ou surface devient nécessaire, nouveau cadrage.

| Ordre | Scénario / preuve attendue |
| --- | --- |
| 0 | Vérifier autorisation privée, compte, région, devis, consentements, allowlist, MFA, arrêt d’urgence, matrice de permissions et tests du futur transport ; toutes les non-régressions passent avant ressource réelle |
| 1 | Attribuer un numéro compatible ; relever coût privé et capacités ; démarrer le tunnel ; verrouiller URL canonique et callbacks ; aucune exposition Tony |
| 2 | Entrant T1, Dial vers T2 qui décroche : parent/enfant, signature réelle, état terminal et résultat Dial corrélés ; un parent completed seul ne prouve pas le décroché |
| 3 | Entrant T1, T2 ne décroche pas : résultat no-answer observé, aucun SMS automatique ; un deuxième Dial réservé |
| 4 | Entrant T1, occupation T2 si reproductible sans troisième personne : résultat busy réel, troisième Dial réservé ; sinon preuve manquante explicitement documentée |
| 5 | Entrant raccroché très court avant Dial : chronologie/état explicites, aucune classification forcée |
| 6 | Deux entrants successifs du même T1, puis deux entrants simultanés T1/T2 : admission/états distincts ; réponses Hangup pour ces quatre appels, aucun Dial supplémentaire |
| 7 | Deux sortants manuels, un vers chaque testeur : décroché et callbacks/lecture réelle ; quatrième/cinquième segment sortant ; audio séparément consenti pendant ces deux appels |
| 8 | Arrêter chaque audio à dix secondes maximum, puis suppression et sonde immédiates §16 ; ne pas commencer le suivant avec une obligation non résolue |
| 9 | Un SMS fixe à chaque testeur, réception confirmée et statut fournisseur réel ; au maximum trois essais supplémentaires réservés, jamais retry automatique ni destination hors allowlist |
| 10 | Comparer chronologies réelles/registre expurgé ; arrêter effets et appels ; terminer nettoyage ; libérer numéro, fermer tunnel, révoquer clés et programmer les purges privées par procédure opérateur |

Plafonds globaux : **10 entrants acceptés ; 5 segments sortants au total, incluant les trois Dial et les deux sortants CLI ; 5 segments SMS sortants ; 2 SMS entrants de réponse au maximum admis ; 2 enregistrements de dix secondes ; 60 secondes par appel, parent inclus**. Séquence nominale : huit entrants. Aucune tentative UNKNOWN ne rend un quota disponible ; aucune réinitialisation du volume pour contourner une limite. Tout segment supplémentaire, même issu d’un rejeu TwiML, compte et bloque si le quota ne peut pas être respecté. Les appels inconnus sont refusés sans Dial/enregistrement/SMS, avec risque de frais résiduels documenté.

REST créateur : réservation transactionnelle avant effet, timeout UNKNOWN, réconciliation bornée par SID connu ou contrôle opérateur sans recréation aveugle. Webhooks : signature avant projection puis compte, ligne, allowlist et ressource/campagne ; suivi SID inconnu refusé. Déduplication durable après restart, états terminaux non régressifs. La signature n’apporte pas de fraîcheur universelle ; les replays ne déclenchent pas d’effet REST. Tester fausses signatures, headers proxy, anciennes ressources, collisions, concurrence, pertes de réponse et saturation **en synthétique** avant live ; aucune panne volontaire génératrice d’appels réels.

Après essais : relancer les contrôles d’isolation et toute gate affectée ; fournir toutes les régressions Tony/POC (lint/typecheck/unitaires/SQL/HTTP/E2E/focus/build/audit/Docker/CI/CodeQL/Dependency Review), commandes et commit exact, mesures de callbacks réellement obtenues et preuves fournisseur expurgées. Le présent dossier n’annonce aucun de ces essais futurs comme exécuté.

## 15. Arrêt d’urgence

Déclencheurs : retrait d’un consentement, appel inconnu anormal, fuite, dépassement/risque budget, quota, UNKNOWN non résolu, signature/admission incohérente, audio incontrôlé ou nettoyage inconclusif.

1. Fermer durablement les admissions/intentions ; aucun retry créateur ni nouveau Dial/SMS/audio.
2. Arrêter les enregistrements et terminer **les appels actifs chez Twilio**, par SID connus ; Console MFA comme secours. Arrêter Node seul ne suffit pas.
3. Désactiver le routage entrant vers des effets, réponse Hangup ; fermer l’exposition publique. Conserver le registre et seulement les credentials indispensables au nettoyage/reconciliation.
4. Exécuter §16 ; constater toute obligation non résolue comme incident bloquant. Si l’arrêt REST échoue, action manuelle fournisseur et signalement immédiat à l’opératrice, sans prolonger les essais.
5. Libérer le numéro et révoquer les accès dès que compatible avec le nettoyage. Consigner coût, limites et preuves expurgées. Ne pas détruire le registre avant réconciliation.

## 16. Suppression audio et preuve DELETED

Obligation durable dès l’intention RECORD, même sans RecordingSid immédiat ; SID tardif réconcilié, jamais oublié. Arrêt borné, DELETE immédiat après disponibilité, trois tentatives maximum, échéance quinze minutes après fin de l’essai audio. DELETED exige cumulativement :

- DELETE fournisseur confirmé (204 attendu), pas un timeout assimilé à un succès ;
- état fournisseur `deleted` vérifié lorsqu’exposé, via lecture incluant les supprimés si nécessaire ; absence d’état explicitement documentée ;
- média non récupérable avec authentification valide et URL fournisseur fixe par SID. Confirmer que les mêmes credentials peuvent accéder à la ressource avant suppression et restent valides après ; 401/403, timeout, mauvaise région ou URL erronée ne prouvent rien. Si média servi, interrompre sans conserver ses octets et déclarer un échec ;
- rapport précisant que les métadonnées Recording peuvent persister environ 40 jours dans Console/API ; présence attendue distincte de la suppression du média ;
- aucune assimilation à une disparition de toute métadonnée ou à un effacement physique instantané des sauvegardes.

[Politique Twilio Voice](https://help.twilio.com/articles/360002588893-Downloading-and-Deleting-Twilio-Call-Recordings). Média récupérable, DELETE non confirmé, preuve inconclusive ou obligation pendante → pas de DELETED, arrêt des essais, Gate audio et validation du lot bloquées. Conserver les moyens privés nécessaires au nettoyage ; ne pas révoquer prématurément leur seule clé.

## 17. Libération, révocation et clôture

Après arrêt/reconciliation/nettoyage : DELETE du numéro fournisseur confirmé ; contrôler son absence des numéros actifs du sous-compte et la suppression de son routage. Ne pas appliquer à Recording ce critère de disparition du numéro. Garder preuve expurgée du succès, location débitée et absence de renouvellement prévu ; surveiller le relevé final, sans promettre remboursement/prorata.

Fermer le connecteur/tunnel, retirer callbacks, révoquer les API keys dédiées et vérifier leur rejet REST ; supprimer montages/fichiers privés et entrées Trousseau dédiées. L’Auth Token n’est pas une API key révocable individuellement : appliquer la rotation primaire/secondaire documentée ou clôturer le sous-compte dédié, et vérifier l’invalidation des anciens tokens après toutes les obligations. Ne jamais tourner un token parent partagé pour ce POC. [Rotation Auth Token](https://www.twilio.com/docs/iam/api/authtoken).

Clôture du sous-compte et éventuelle fermeture du parent nouvellement créé à approuver avec son titulaire après contrôle de solde/rétention ; aucune suppression automatique de compte existant. Révoquer toute clé de nettoyage résiduelle après résolution. Purges locales selon §13 ; aucune sauvegarde audio créée. Libération échouée, credential non révoqué ou coût récurrent non résolu : clôture non démontrée, signalement et Gate bloquée.

## 18. Critères d’échec et état de Gate 1

Gate 1 reste **OPEN**, puis échoue à la validation si une preuve obligatoire manque : numéro/capacités autorisés indisponibles, vraie ligne non jointe, états parent/enfant ou manqué non démontrés, signature/admission contournable, SMS seulement accepté mais non reçu, sortant non reçu, audio non consenti/non borné/non supprimé, duplication d’effet/replay/restart, retry UNKNOWN aveugle, quota ou budget dépassé, données sensibles persistées, accès réseau/credentials Tony possible, non-régression échouée, numéro/credential/nettoyage non clôturé.

Occupation non reproductible et toute capacité non vérifiable sont rapportées comme preuves manquantes ; aucune exemption implicite. Les exigences ne sont pas assouplies pour obtenir un succès. Un fake ou test credential ne ferme jamais Gate 1. Même toutes les preuves recueillies, la validation finale reste humaine ; aucun Lot 6, fusion ou production automatique.

## PROVIDER_TEST : disponibilité non établie

Aucun compte ou credential fournisseur n’a été inspecté. Des test credentials préexistants ne sont donc **pas confirmés disponibles**. Twilio indique qu’on ne peut plus en créer dans la nouvelle Console, mais que ceux de l’ancienne Console peuvent fonctionner. Après autorisation séparée seulement, ils permettraient des essais REST simulés d’achat de numéro, SMS et création d’appel, et certaines erreurs documentées ; sans facturation ni contact avec de vrais téléphones. Ils ne prouvent ni disponibilité réglementaire réelle, livraison, callbacks d’état, audio réel, suppression média, résidence effective ni Gate 1. [Test credentials officiels](https://www.twilio.com/docs/iam/test-credentials). Aucun compte/credential n’est créé pour rendre ce niveau disponible ; un trial avec effets réels appartient à LIVE_POC.

## Manifeste privé à compléter avant tout effet

À conserver hors dépôt : titulaire et compte/sous-compte exacts ; catégorie/numéro/SID et capacités ; validation réglementaire ; région et tokens de signature attendus ; devis total en EUR et acceptation du risque résiduel ; responsable ; T1/T2 et deux consentements séparés ; rétentions/conditions fournisseur acceptées ; URL canonique effectivement attribuée ; permissions des clés ; commit live testé ; vérification d’arrêt/nettoyage ; feu vert humain daté. Aucun de ces éléments manquants n’est remplacé par une valeur inventée.

**Arrêt après ce dossier. Aucune ressource externe, secret, tunnel, effet, code LIVE_POC, fusion ou production n’a été créé ou modifié.**
