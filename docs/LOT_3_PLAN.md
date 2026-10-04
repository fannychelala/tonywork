# Lot 3 — cadrage documentaire du CRM minimal

Date : 4 octobre 2026. **Cadrage corrigé validé ; implémentation explicitement autorisée par l’utilisateur.** Lots 0, 1 et 2 validés par l’utilisateur. Ce document n’autorise aucun code, migration ou nouveau test exécutable. Arrêt après sa préparation.

## Sources et état initial

Brief complet v1.0 relu, notamment §21–31, 56, 72–94, 101–118, 127–128 et séquencement des lots suivants ; AGENTS.md ; ADR 0001–0007 ; modèle Prisma, migrations SQL, docs/DATA_MODEL.md, docs/RLS.md, service organizations, withTenant et API shell existants.

Le §127 prescrit Contact, Opportunity, ServiceTemplate, Task et les cinq écrans existants, avec providers externes mockés. Il ne fixe pas les champs ni une matrice de permissions CRM détaillée : les choix bornés ci-dessous sont des propositions pour cette validation, et non des décisions déjà acceptées. La base reste le Lot 2 validé ; aucune fusion de PR ni mise en production n’est incluse.

## Périmètre fonctionnel proposé

| Domaine / écran | Fonction livrable après autorisation |
|---|---|
| Contacts | Liste paginée, recherche serveur nom/téléphone, fiche ; OWNER crée, rectifie et supprime un contact non référencé. Téléphone E.164 obligatoire, déduplication uniquement dans son organisation. |
| Opportunités | Liste paginée, filtre état, fiche ; création manuelle liée à un contact, prestation facultative, modification et changement d’état ; archivage. Suppression explicite OWNER après confirmation et seulement sans tâche liée. |
| Prestations | Catalogue propre au tenant : liste, création/modification OWNER, désactivation ; suppression uniquement sans référence. Prix indicatifs, jamais devis ou engagement. |
| Tâches / Aujourd’hui | Création manuelle rattachée à une opportunité, titre et échéance facultative ; modifier, terminer/réouvrir, supprimer avec confirmation. Aujourd’hui montre tâches en retard et du jour, puis opportunités à traiter, tri date stable sans score. |
| Paramètres | Structure Lot 2 conservée ; pas de nouveaux paramètres d’organisation, gestion d’équipe ou préférence persistante. |

États Opportunity proposés pour ce minimum : NEW, TO_CONTACT, WAITING_CUSTOMER, WON, LOST, ARCHIVED (sous-ensemble des états proposés §30). Création NEW ; passage entre états non archivés explicite ; archivage depuis tout état et restauration vers NEW. ARCHIVED est l’unique mécanisme d’archivage d’Opportunity dans ce lot : aucun soft-delete, deletedAt, archivedAt ou indicateur parallèle. La suppression explicite autorisée ci-dessus reste une suppression physique restrictive, distincte de l’archivage. Aucun effet automatique, aucune valeur de chiffre d’affaires calculée. Task : OPEN/DONE ; retour OPEN explicite. Les transitions autorisées sont validées par le domaine et leurs valeurs par PostgreSQL ; une transition vers WON ne termine pas les tâches automatiquement.

Aucune suppression silencieuse/cascade d’un graphe CRM, import/export, fusion de contacts, adresse dédiée, affectation à un collaborateur, tags, pièce jointe, transcript, appel, SMS, formulaire public, onboarding, calendrier/Appointment, géocodage, automatisation, notification, scoring ou reporting ROI. Les états complets du §30 seront ajoutés quand les workflows correspondants existent. Pas de faux bouton « Appeler » ou « Envoyer », pas de données de démonstration injectées dans le produit.

Les providers existants restent locaux/fakes ; ce lot ne nécessite aucun appel fournisseur ni nouveau provider, SDK, bibliothèque, abonnement ou secret. Si un besoin apparaît, documenter sa justification et obtenir validation avant ajout. Pas de scaffolding des providers des lots ultérieurs.

## Entités, contraintes et migrations attendues

**Quatre nouvelles tables seulement**, à créer après validation. Noms SQL proposés : contact, opportunity, service_template, task. Toutes : organizationId UUID non nul, id UUID aléatoire, dates createdAt/updatedAt UTC timestamptz, version entière pour concurrence optimiste. Clé primaire composite (organizationId,id), sans unicité globale supplémentaire sur id ; URL UUID à interpréter uniquement avec le tenant autorisé. Référence organizationId vers Organization existante, suppression RESTRICT.

| Table | Champs métier minimaux proposés | Contraintes / relations |
|---|---|---|
| Contact | name, phone E.164, email facultatif | UNIQUE(organizationId,phone). Nom 1–120 caractères ; email borné/validé, non unique. Même téléphone permis chez A et B. Pas de notes libres au contact. |
| ServiceTemplate | name, description facultative, currency explicite, averageAmountMinor/minAmountMinor/maxAmountMinor facultatifs, durationMinutes facultative, active | Entiers monétaires non négatifs et bornés compatibles JSON ; min ≤ moyenne ≤ max lorsque présents, min ≤ max. Durée positive bornée. Devise code pris en charge validé, aucune conversion ni hypothèse EUR centrale. |
| Opportunity | contactId obligatoire, serviceTemplateId facultatif, title, description facultative, status | FK composites (organizationId,contactId) et (organizationId,serviceTemplateId), RESTRICT. Pas de prix copié/inventé, score ou valeur gagnée. |
| Task | opportunityId obligatoire, title, dueAt facultatif, status, completedAt facultatif | FK composite vers Opportunity, RESTRICT. OPEN impose completedAt nul ; DONE impose date non nulle. Pas de contactId redondant ni assignation User globale. |

Bornes proposées : titre 1–160 caractères, descriptions 0–2000 ; montants au plus 999 999 999 unités mineures, durée au plus 525 600 minutes. Les limites doivent être identiques Zod/SQL, avec normalisation des espaces ; champs optionnels explicites, sans mass assignment. Texte brut échappé, jamais HTML rendu. Numéro déjà au format international : pas de conversion nationale implicite. Une validation syntaxique E.164 ne garantit pas l’existence du numéro.

organizationId/id immuables après création : déclencheur SQL rejette leur modification, même pour un utilisateur membre de deux tenants. Les FK composites et l’unicité tenantée empêchent références et collisions révélant un enregistrement B ; aucune FK métier sur id seul. Les erreurs de contrainte internes ne sont jamais renvoyées au client.

Index tenant-first : Contact(organizationId,name,id) et unicité téléphone ; Opportunity(organizationId,status,createdAt,id), (organizationId,contactId), (organizationId,serviceTemplateId) ; Task(organizationId,status,dueAt,id), (organizationId,opportunityId) ; ServiceTemplate(organizationId,active,name,id). Recherche bornée, pas d’extension pg_trgm anticipée ; mesurer les requêtes avant ajout d’index spécialisé.

Une migration additive explicite est envisagée : tables/contraintes/index, ENABLE + FORCE RLS, politiques, grants ciblés, triggers d’immuabilité/audit dans le même déploiement atomique. Mise à jour Prisma correspondante, aucun backfill ni seed CRM automatique : tables initialement vides. Numéro définitif de migration à déterminer à l’implémentation. Aucune modification des tables d’identité, sessions, grants ou du contrat open_context/current_context. Aucun GRANT sur toutes les tables présentes/futures ni privilège par défaut élargi.

Rollback : revenir au Lot 2 en laissant les tables additives sans utilisation ; pas de DROP ni suppression de données improvisée. Valider migration depuis Lot 2 et base fraîche avant livraison.

## Autorisation, RLS et audit à démontrer

Flux : UI → API/action → session Better Auth vérifiée → validation Zod → service → repository dans **la même transaction withTenant** → tony_app → PostgreSQL. organisation dans l’URL cible une demande ; jamais une preuve. Aucun Prisma dans les composants, aucune lecture CRM via tony_auth/migrator, aucune session/token dans DTO.

| Principal | SELECT nouvelles tables | INSERT / UPDATE / DELETE |
|---|---|---|
| OWNER membre du tenant courant | Oui, uniquement ce tenant | Oui, ce tenant, contraintes métier et confirmation UI des suppressions |
| MEMBER membre du tenant courant | Oui, uniquement ce tenant | Non, également en SQL direct |
| Non membre, contexte absent/invalide, session expirée/révoquée | Aucun accès | Aucun accès |
| PLATFORM_ADMIN | Aucun nouvel accès CRM dans ce lot | Aucun accès |

Cette matrice conservatrice prolonge MEMBER en lecture seule du Lot 1 ; toute ouverture de droits nécessite un nouveau cadrage. Les endpoints CRM refusent PLATFORM_ADMIN même avec Membership. Les politiques nouvelles refusent aussi administrator=true : le grant existant ne gagne **aucune** table CRM. Un rôle plateforme présenté avec un contexte ordinaire reste soumis au refus existant open_context, à vérifier directement dans les tests.

Pour chacune des quatre tables : SELECT USING compare organizationId au contexte privé valide non administrateur ; INSERT WITH CHECK exige contexte OWNER et tenant égal ; UPDATE utilise **USING et WITH CHECK** OWNER/tenant ; DELETE USING OWNER/tenant. Rien fondé sur GUC client seul. tony_app reçoit seulement les quatre droits DML nécessaires sur ces tables ; tony_auth aucun. tony_migrator reste offline, propriétaire, avec politique infrastructure ciblée si nécessaire aux migrations et triggers ; aucun héritage runtime, BYPASSRLS ou nouveau rôle.

Les FK ne remplacent pas RLS : vérification du parent dans la transaction, FK composite comme garde SQL complémentaire, réponse générique pour parent étranger/inexistant. Une modification de organizationId est interdite même avec accès aux deux organisations. Aucun déplacement inter-tenant.

Audit append-only existant : triggers SQL CRM ajoutent CREATED/UPDATED/DELETED pour chaque entité (y compris état/archivage/désactivation), avec acteur/tenant issus du contexte, cible UUID, corrélation et date seulement. Déclencheur SECURITY DEFINER étroit, propriétaire offline, search_path fixé, objets qualifiés, aucun SQL dynamique ni EXECUTE PUBLIC ; vérifie OWNER/tenant avant insertion. Pas de copie de nom, téléphone, email, description, prix ou token dans l’audit. L’écriture métier et son audit sont atomiques ; rollback annule les deux. Cela ne change pas l’audit **précommité** spécifique aux lectures administrateur Lot 1. Pas de nouvel endpoint d’export/audit ni provider analytics ; premiers événements opportunité/tâche peuvent être déduits des événements de création, sans table supplémentaire ni envoi externe.

Dette ADR 0006 conservée : possession simultanée du rôle runtime et d’une session admin valide permet réutilisation courte du grant existant. Aucune extension de durée, portée, droits, ni assouplissement MFA/justification/session/audit.

## Confidentialité et mutations HTTP

DTO explicites par liste/fiche, projection minimale ; pas d’identité, membership ou audit joint globalement. HTML/RSC initiaux génériques comme ADR 0007 ; données privées exclusivement après autorisation, réponses succès **et erreur** private/no-store, Vary Cookie, fetch no-store. Pas de cache partagé, stockage local, prefetch tenant ou changement de navigation sans tests dédiés. Le retrait du DOM, annulation des requêtes et revalidation historique/focus/visibilité du Lot 2 doivent couvrir toutes les fiches/listes/formulaires, y compris une réponse ancienne arrivée après changement de tenant ou déconnexion.

Mutations non GET, JSON strict et taille bornée, rejet des champs inconnus/organizationId/acteur/version malformés ; contrôle Origin de même origine (refus absent/invalide sur mutations navigateur), cookies existants, aucune CORS permissive. SQL paramétré. Erreurs 401 sans session, 404 uniforme pour objet inexistant/étranger, 403 pour MEMBER au sein de son tenant sans exposition d’objet étranger, 409 de concurrence/conflit uniquement après autorisation locale ; pas de stack/contrainte SQL dans réponse. Les API n’utilisent pas les erreurs globales pour distinguer l’existence chez B.

Version attendue + incrément atomique empêchent écrasement concurrent ; prévention de double soumission UI par verrou de soumission et bouton désactivé pendant la requête, vérifiée séparément des replays HTTP. Cette protection UI ne garantit aucune idempotence réseau persistante : deux POST rejoués peuvent créer deux objets si aucune contrainte métier ne les empêche (notamment Opportunity et Task). Le téléphone unique tenanté protège seulement le doublon Contact, pas toutes les créations. En cas de résultat de création incertain, relecture/confirmation et aucun retry automatique aveugle ; aucune clé d’idempotence ni persistance supplémentaire ajoutée dans ce lot. Pas d’optimisme sur suppressions ou changement de tenant. Pages de 25 éléments, maximum 50 ; curseur tenanté validé, tri stable avec id, recherche ≤120 caractères. Limiter corps et requêtes ; pas de recherche/export massif ni mécanisme anti-abus externe inventé.

## Source de vérité et règle exacte d’Aujourd’hui

La timezone existe déjà : **Organization.timeZone**, champ String non nul du modèle prisma/schema.prisma, valeur par défaut Europe/Paris, persisté par la migration Lot 1 20261004000000_auth_tenant_rls. Le brief §20 prévoit explicitement une timezone par organisation et des dates persistées en UTC. La création existante valide timeZone via Intl et le transmet à PostgreSQL. Ce champ existant est la source de vérité ; le défaut ne remplace jamais une valeur déjà configurée.

Lire Organization.timeZone côté serveur dans le contexte session/Membership/withTenant/RLS autorisé, sans contourner la projection minimale du shell pour charger une organisation non autorisée. Aucun champ, préférence, table ni écran de configuration supplémentaire ; aucune timezone fournie par le client, le navigateur ou la machine serveur comme autorité. Si la valeur persistée est invalide, état erreur explicite, sans fallback silencieux ni écriture corrective automatique.

Capturer une seule fois l’instant serveur de référence par requête. « Aujourd’hui » est la date civile de cet instant dans Organization.timeZone. Calculer les bornes UTC correspondant au début de cette date locale et au début de la date locale suivante ; intervalle semi-ouvert [début, début suivant), sans addition fixe de 24 heures. Pour les tâches OPEN : dueAt < début signifie en retard ; début ≤ dueAt < début suivant signifie du jour ; dueAt nul reste sans échéance et n’est pas classé du jour/en retard. Les tâches DONE sont exclues de ces deux groupes. Les opportunités à traiter ne reçoivent pas une échéance inventée.

Tests à prévoir : organisation Europe/Paris et organisation dans une autre timezone à un même instant UTC donnant des dates locales différentes ; changements DST (journées 23/25 heures), inclusion au début/exclusion au début suivant, tâches sans échéance/terminées, timezone navigateur différente sans effet, valeur persistée invalide sans fallback, refus de lecture des paramètres B depuis A.

## Tests définis avant implémentation

Préparer d’abord fixtures A/B synthétiques via sessions/memberships réelles, OWNER et MEMBER par tenant, non-membre, admin MFA et contexte de grant existant ; doubles sessions, membre de A+B et révocation. Setup privilégié réservé aux fixtures ; appels métier et assertions de sécurité sous tony_app. Aucun fichier client/réel, fournisseur externe ni credential production.

| Couche | Cas obligatoires / preuve attendue |
|---|---|
| PostgreSQL, chaque nouvelle table | OWNER A lit/crée/modifie/supprime A ; A SELECT B zéro ligne, UPDATE/DELETE B zéro effet, INSERT portant B rejeté ; snapshot B inchangé. MEMBER A lit A et chaque mutation est refusée. Sans contexte et GUC falsifié mêmes refus. |
| Contextes | Session invalide/expirée/révoquée, email dévérifié, Membership supprimée/downgradée : refus à la lecture/écriture suivante. Commit/rollback/pool puis autre tenant : aucun contexte réutilisé. |
| Relations / intégrité | FK Contact/ServiceTemplate/Opportunity de B depuis A refusées ; même UUID local possible A/B sans collision globale ; même téléphone A/B autorisé, doublon A refusé ; organisation/id immuables même membre A+B. Suppression parent référencé refusée, B inchangé. Valeurs/statuts/bornes invalides refusés directement SQL. |
| Admin / privilèges | Admin sans grant refusé ; grant existant ne permet ni SELECT CRM ni écriture ; aucun audit/grant implicite par API ; protections MFA/raison/rollback Lot 1 inchangées. Rôles sans DDL/SET ROLE/BYPASSRLS, tony_auth sans droits CRM. Inspection ENABLE/FORCE et politiques de chaque table. |
| Audit SQL | Mutation réussie produit événement correct même en accès SQL direct ; rollback métier n’enregistre pas une mutation inexistante ; tentative cross-tenant ne crée pas de faux événement B ; absence de PII/secrets ; UPDATE/DELETE audit refusés, audit admin précommité conservé. |
| Unitaire | Schémas stricts, E.164, bornes argent/devise/durée, états et règles FK/suppression, timezone/jour DST, versions concurrentes, DTO minimal, textes fr-FR/en-GB. Aucun score anticipé. |
| Intégration HTTP réelle | CRUD autorisé, non-membre, routes/parents/curseurs B, mass assignment, injection/texte HTML, mauvaise origine/CSRF, corps excessif, session révoquée ; no-store sur erreurs/succès, erreurs existence indistinguables. Deux modifications version identique : une seule réussit. |
| E2E desktop + mobile | Créer contact → prestation → opportunité → tâche → terminer/réouvrir → changer état/archiver ; recherche/filtres/pagination ; suppression confirmée et parent lié refusé. États vide/loading/error, retry sûr, MEMBER sans actions d’écriture mais appels directs aussi refusés. |
| Double soumission UI | Deux activations rapides du formulaire (clic/touche Entrée) pendant une requête retardée : une seule requête de création, bouton désactivé et verrou actif ; réactivation après résultat/erreur, sans envoi automatique supplémentaire. Ce test prouve uniquement la prévention UI. |
| Rejeu/retry HTTP de création | Deux POST identiques directs, indépendants du bouton : vérifier les effets réellement définis par les contraintes (Contact : doublon téléphone local refusé ; Opportunity/Task et prestations sans unicité métier : duplications possibles, sans garantie d’idempotence). Simuler une réponse perdue après commit : aucune relance automatique du client ; relecture et confirmation avant nouvelle création. Aucun résultat présenté comme « exactement une fois » à partir de la désactivation UI. |
| E2E anti-fuite | Noms/téléphones/descriptions marqueurs B absents DOM, HTML, RSC, réponses, prefetch chez A sur liste/fiche/recherche ; URL/id/relations B refusés. Révocation/logout/historique/focus/changement A→B et réponse retardée : ni données ni formulaire A restaurés hors autorisation. |
| UX / régression | Clavier, focus initial/restauré, Escape, alertes erreurs, labels, touch ≥44px, 320px sans overflow ; cinq écrans, captures et revue visuelle desktop/mobile. Conserver tous les tests Lot 1/2 et les répétitions de focus. |

Tests SQL négatifs écrits avant repositories/API/UI ; contrôle de toutes les tables et de toutes les opérations, pas seulement le chemin heureux applicatif. Les tests HTTP/visuels complètent la frontière SQL. Aucun skip, assertion diminuée, mock de RLS ou privilège migrateur utilisé pour « faire passer » un contrôle.

## Risques et décisions à valider

- Nouvelles permissions DML augmentent la surface : politiques complètes, contraintes composites, triggers étroits et tests SQL directs sont des gates bloquantes.
- Téléphone unique est un choix minimal par tenant, pas une identité universelle ; téléphones partagés/changement de numéro/fusion hors périmètre. Pas de test d’existence chez une autre organisation.
- Catalogue prix indicatif, multi-devise sans conversion ; aucune estimation présentée comme CA ou devis. Champs de scoring/difficulté/zone attendent les lots dédiés.
- Texte libre et coordonnées sont personnels ; minimiser projections/logs/artifacts. Validation actuelle exclusivement synthétique, aucune durée de rétention inventée ni purge automatique avant politique opérationnelle validée. Export/anonymisation complets restent futurs prérequis avant usage réel.
- Suppression bornée sans cascade : références RESTRICT, confirmation, audit minimal, accès OWNER. Les fixtures peuvent nettoyer en setup privilégié sans déverrouiller runtime.
- Concurrence, pagination et réponses retardées peuvent causer écrasement ou fuite visuelle : versions, revalidation et tests dédiés. Aucun cache ajouté par commodité.
- Aujourd’hui utilise exclusivement Organization.timeZone existant (voir règle exacte ci-dessus), instants UTC et bornes civiles/DST testés ; aucune nouvelle préférence, hypothèse « 24 heures » ni classement commercial inventé.
- Limite ADR 0007 conservée : une révocation distante n’efface pas des octets déjà transmis ni instantanément un écran sans événement de revalidation. Chaque nouvelle lecture passe par PostgreSQL.
- Dettes acceptées conservées : braces dev-only, grant admin court, contraintes Mac, email local, nettoyage global contextes/grants, préparation opérationnelle production. Vercel hors périmètre.

Validation du cadrage demandée sur : droits OWNER/MEMBER conservateurs, quatre tables/champs/relations, états réduits et opérations manuelles, suppression restrictive, refus total CRM plateforme, audit SQL. Si ces décisions sont validées, les consigner dans une ADR dédiée CRM/RLS avant code ; ce document ne modifie aucune ADR acceptée ni politique actuelle.

## Ordre de réalisation après feu vert et gates finales

1. Consigner la décision validée ; créer fixtures et tests négatifs SQL/API d’abord.
2. Migration additive atomique et modèle Prisma, contrôles privilèges/RLS/audit/invariants.
3. Services/repositories transactionnels et APIs strictes, puis UI sur primitives Lot 2 ; dictionnaires et états complets.
4. Exécuter pnpm lint, pnpm typecheck, pnpm test, pnpm test:integration, pnpm build, pnpm test:e2e, pnpm exec playwright test tests/e2e/shell-ui.spec.ts --repeat-each=3 --output=test-results/focus-stability, pnpm audit --prod --audit-level=high. Conserver les 45 PostgreSQL et 14 E2E existants, plus nouveaux tests avec comptes rendus exacts (aucun compte prédit présenté comme réussi).
5. Docker : pnpm local:up, migrations, readiness 200, redémarrage/volume/arrêt ; migrations depuis base fraîche et Lot 2. CI complète, CodeQL, Dependency Review ; Linux CI pour contrôles empêchés sur Mac, sans revendication locale fictive. Aucun déploiement production.
6. Revue manuelle clavier/formulaires/confirmations, desktop/mobile/320px et captures synthétiques ; examiner requêtes/index et pagination, absence N+1. Cibles performance du brief à mesurer, jamais annoncées atteintes sans mesures.
7. Rapport final : fichiers, ADR, migrations, commandes réellement exécutées, résultats CI/tests SQL/APIs/E2E, preuves A/B, audit, accessibilité/visuel, sécurité/confidentialité/performance/i18n, risques/divergences et rollback. Arrêt pour revue humaine ; aucun Lot 4 sans autorisation.

## Contrôle de cette préparation

Uniquement ce plan documentaire et mise à jour du statut de validation Lot 2 dans AGENTS.md/ADR 0007. Brief et ADR relus, inspection du modèle/migrations/service/session/RLS existants ; aucune modification source, configuration CI, dépendance, schéma, migration, provider ou test. Les gates applicatives ne sont pas relancées pour ce cadrage documentaire, et aucun résultat Lot 3 n’est revendiqué. **Attente de validation humaine explicite avant implémentation.**
