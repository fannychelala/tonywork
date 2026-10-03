# TONY

## Brief maître produit, architecture, sécurité et développement Codex

**Nom d’affichage : Tony**
**Domaine de travail : tonywork.com**
**Statut : projet en développement local**
**Version du brief : 1.0**

---

# 1. OBJECTIF DU DOCUMENT

Ce document constitue la référence principale pour le développement de Tony.

Il doit permettre à Codex de :

* comprendre précisément la vision produit
* respecter une architecture cohérente dans la durée
* travailler par lots indépendants
* maintenir un haut niveau de sécurité
* garantir l’isolation entre clients
* préserver les performances
* limiter la dette technique
* préparer l’internationalisation
* produire une UX digne des meilleurs SaaS B2B
* faire évoluer la plateforme sans avoir besoin d’une équipe de développement importante

Tony sera construit principalement avec Codex.

L’architecture et le code doivent donc être particulièrement :

* explicites
* documentés
* testables
* modulaires
* prédictibles
* simples à comprendre par un agent de développement
* simples à modifier sans effet de bord

L’objectif n’est pas de produire le plus de code possible.

L’objectif est de produire le système le plus simple capable de répondre correctement au besoin.

---

# 2. VISION PRODUIT

Tony est un assistant commercial et opérationnel destiné aux indépendants et TPE de services terrain.

Premières cibles :

* plombiers
* chauffagistes
* climaticiens
* électriciens
* couvreurs
* serruriers
* dératiseurs
* entreprises de maintenance
* autres professionnels recevant régulièrement des demandes entrantes par téléphone

Tony ne doit pas être pensé comme un simple répondeur ou secrétariat téléphonique.

Tony doit transformer les demandes entrantes en opportunités commerciales structurées.

La chaîne de valeur est :

```text
DEMANDE
↓
CAPTURE
↓
COMPRÉHENSION
↓
QUALIFICATION
↓
PRIORISATION
↓
ACTION
↓
CONVERSION
↓
MESURE DU ROI
```

---

# 3. PROBLÈME RÉSOLU

Un professionnel de terrain reçoit des appels alors qu’il est :

* sur un chantier
* en déplacement
* avec un client
* en train de travailler physiquement
* incapable de prendre des notes
* incapable de répondre immédiatement

Le problème n’est pas seulement qu’il rate un appel.

Il peut également :

* rappeler trop tard
* oublier un prospect
* perdre les informations données oralement
* ne pas savoir quelle opportunité traiter en premier
* consacrer du temps à une faible opportunité
* oublier un engagement pris au téléphone
* ne jamais relancer une demande non urgente
* perdre de la visibilité sur son futur carnet de commandes

Tony doit réduire ces pertes.

---

# 4. DIFFÉRENCIATION

Le marché contient déjà de nombreux outils proposant :

* standard téléphonique IA
* agent vocal
* SMS après appel manqué
* prise de rendez-vous
* transcription
* secrétariat automatisé

Ces fonctionnalités ne constituent pas la différenciation principale de Tony.

Tony doit se différencier par :

## 4.1 Priorisation commerciale

Tony doit aider le professionnel à répondre à :

> Parmi toutes les demandes que j’ai reçues, lesquelles valent réellement mon temps ?

## 4.2 Opportunity Score

Chaque opportunité doit être évaluée en fonction de :

* valeur potentielle
* effort
* durée
* complexité
* distance
* urgence
* probabilité de conversion
* compatibilité avec le planning
* préférence du professionnel
* potentiel de marge
* historique client

## 4.3 CRM automatique

Le CRM doit se construire principalement sans saisie manuelle.

Les informations proviennent de :

* appels
* formulaires
* SMS
* transcriptions
* actions utilisateurs
* planning
* historique client

## 4.4 Conversation vers action

Une transcription seule n’a pas suffisamment de valeur.

Chaque conversation doit pouvoir produire automatiquement :

* résumé
* besoin
* prestation identifiée
* prochaine action
* tâches
* engagements
* échéances
* mise à jour de l’opportunité
* suggestions de suivi

## 4.5 Automatisation du suivi

Une opportunité qui n’est pas urgente ne doit pas disparaître.

Tony doit permettre de :

* demander automatiquement des informations
* demander des photos
* proposer un rendez-vous
* programmer une relance
* envoyer un message
* réactiver une opportunité au bon moment

## 4.6 ROI visible

Tony doit constamment matérialiser sa valeur.

Exemple :

```text
Ce mois-ci

32 demandes reçues
14 appels récupérés
21 opportunités qualifiées
7 chantiers gagnés
8 420 € de CA déclaré
```

---

# 5. POSITIONNEMENT

Tony n’est pas :

* un ERP
* un logiciel comptable
* un logiciel de devis
* un outil de paie
* un CRM complexe
* un standard téléphonique uniquement
* un logiciel de prospection

Tony est :

> L’assistant qui transforme les demandes entrantes en opportunités commerciales et aide le professionnel à traiter les meilleures.

Le message utilisateur doit rester extrêmement simple.

Exemples :

> Tony récupère vos demandes pendant que vous travaillez.

> Tony vous aide à savoir qui rappeler en premier.

> Tony transforme vos appels en opportunités.

> Tony vous aide à remplir votre carnet de commandes sans perdre de temps.

---

# 6. PRINCIPES PRODUIT

Chaque nouvelle fonctionnalité doit répondre à au moins une de ces questions :

1. Permet-elle de récupérer une demande ?
2. Permet-elle de mieux comprendre une demande ?
3. Permet-elle de mieux qualifier une opportunité ?
4. Permet-elle de mieux la prioriser ?
5. Permet-elle de mieux la convertir ?
6. Permet-elle de réduire la charge administrative ?
7. Permet-elle de démontrer la valeur générée ?

Si la réponse est non, la fonctionnalité doit probablement rester hors du cœur produit.

---

# 7. UX

La qualité UX est une exigence majeure.

Tony doit être comparable dans son niveau de finition à des références comme :

* PayFit
* Doctolib
* Pennylane
* Linear
* Stripe

Il ne s’agit pas de copier leurs interfaces.

Il faut reprendre leurs principes :

* simplicité
* hiérarchie visuelle évidente
* sentiment de confiance
* très peu de friction
* textes courts
* progression claire
* feedback immédiat
* actions principales évidentes
* écrans respirants
* excellente qualité mobile
* progressive disclosure

Tony ne doit jamais ressembler à un logiciel métier ancien.

---

# 8. MOBILE FIRST

Les professionnels utiliseront souvent Tony depuis leur téléphone.

Chaque écran doit donc être pensé d’abord pour un écran mobile.

Le desktop doit ensuite exploiter l’espace supplémentaire.

Priorités mobiles :

* boutons larges
* zones tactiles importantes
* navigation simple
* pas de tableaux impossibles à lire
* informations essentielles visibles immédiatement
* actions accessibles avec peu de taps
* formulaires courts
* chargement rapide

Tony doit fonctionner comme une PWA performante avant d’envisager des applications natives.

---

# 9. PAGE D’ACCUEIL

La page principale doit répondre à :

> Qu’est-ce que je dois faire maintenant ?

Exemple :

```text
Bonjour David

Aujourd’hui

3 opportunités prioritaires
Potentiel : 6 050 €

1. Remplacement chaudière
   3 500 €
   6 km
   Cette semaine
   Rappeler

2. Tableau électrique
   2 200 €
   4 km
   Sous 10 jours
   Proposer une visite

3. Fuite
   350 €
   2 km
   Urgent
   Rappeler
```

Puis :

```text
Tony s’en est occupé

4 demandes qualifiées
2 prospects ont reçu une demande de photos
1 relance programmée
```

Ne pas transformer l’accueil en dashboard analytique complexe.

---

# 10. STACK TECHNIQUE

Réutiliser autant que possible la stack éprouvée sur Pilotage.

## Framework

**Next.js 16**

App Router.

## UI

**React 19**

## Langage

**TypeScript strict**

Aucun relâchement volontaire du mode strict.

## Base

**PostgreSQL 18**

## ORM

**Prisma 7**

## Validation

**Zod**

Toutes les entrées externes doivent être validées.

## Authentification

**Better Auth**

## Emails

**Resend**

## Tests unitaires et intégration

**Vitest**

## End-to-end

**Playwright**

Chromium minimum.

## CI

GitHub Actions.

---

# 11. POURQUOI CONSERVER CETTE STACK

Cette stack est adaptée car :

* elle est déjà maîtrisée dans Pilotage
* les conventions Codex existent déjà
* elle est fortement typée
* PostgreSQL permet une isolation multi-tenant robuste
* Prisma facilite la compréhension du modèle par Codex
* Better Auth évite de reconstruire l’authentification
* Vitest et Playwright permettent une couverture importante
* Next.js permet web + backend sans multiplier les applications

Il n’y a aucune raison de multiplier inutilement les technologies.

---

# 12. ARCHITECTURE

Tony doit commencer comme un :

> **monolithe modulaire**

Pas de microservices en V1.

Architecture :

```text
Next.js
│
├── UI
├── API / Server Actions
├── Services métier
├── Modules domaine
├── Providers externes
├── Jobs
│
└── PostgreSQL
```

La séparation doit être logique dans le code, pas physique dans plusieurs infrastructures.

---

# 13. ARCHITECTURE MODULAIRE

Structure cible indicative :

```text
src/
  app/

  modules/
    auth/
    organizations/
    contacts/
    opportunities/
    inbound-requests/
    services/
    calls/
    transcripts/
    messaging/
    forms/
    scoring/
    tasks/
    planning/
    automations/
    analytics/
    billing/
    referrals/
    support/

  server/
    services/
    repositories/
    jobs/
    security/
    observability/

  providers/
    telephony/
    ai/
    maps/
    email/
    billing/
    storage/

  shared/
    ui/
    types/
    utils/
    validation/
    i18n/

  db/
```

La structure exacte peut être adaptée si Codex justifie clairement une amélioration.

---

# 14. INTERNATIONALISATION

Tony doit être internationalisable dès la V1.

Le premier marché est la France.

Langue V1 :

```text
fr-FR
```

Mais aucune architecture ne doit supposer que :

* les utilisateurs sont français
* les prospects parlent français
* la devise est l’euro
* les numéros sont français
* les adresses sont françaises
* les messages sont en français

---

# 15. LANGUES

Prévoir dès le départ une couche i18n complète.

Exemples futurs :

```text
fr-FR
en-GB
en-US
es-ES
de-DE
it-IT
nl-NL
```

Les textes d’interface ne doivent pas être dispersés en dur dans les composants.

Centraliser les traductions.

Architecture compatible avec une librairie i18n mature adaptée à Next.js.

---

# 16. LANGUE DU BACK-OFFICE

Le back-office interne Tony doit lui aussi pouvoir être traduit.

Exemple :

un opérateur français utilise le français.

Un futur collaborateur britannique pourra sélectionner l’anglais.

La langue du back-office ne doit pas être couplée à celle du tenant consulté.

---

# 17. LANGUE CLIENT ET LANGUE PROSPECT

Séparer :

```text
userLocale
organizationDefaultLocale
prospectLocale
```

Un artisan français peut un jour travailler avec un prospect anglophone.

Les messages automatiques doivent pouvoir utiliser la langue du prospect lorsque celle-ci est connue.

---

# 18. CONFIGURATION PAYS

Prévoir une abstraction :

```text
CountryConfiguration
```

Elle pourra gérer :

* devise
* timezone
* format téléphonique
* adresse
* réglementation
* fournisseur téléphonique
* règles SMS
* formats de date
* TVA
* langues supportées

Ne pas ajouter toutes les règles internationales maintenant.

Préparer seulement l’architecture.

---

# 19. DEVISES

Ne jamais coder :

```text
€
```

comme hypothèse métier centrale.

Utiliser :

```text
currency = EUR
```

et des montants stockés en unités mineures.

Exemple :

```text
120000
```

pour 1 200,00 €.

---

# 20. TIMEZONES

Toutes les dates persistées en UTC.

Chaque organisation possède une timezone.

Exemple :

```text
Europe/Paris
```

L’interface affiche les dates dans la timezone appropriée.

---

# 21. MULTI-TENANT

Chaque client constitue une organisation.

Toutes les données métier doivent être tenantées.

Exemples :

```text
organizationId
```

sur :

* contacts
* opportunities
* calls
* transcripts
* tasks
* services
* appointments
* messages
* automation rules

---

# 22. RLS

Réutiliser le niveau d’exigence de Pilotage.

Utiliser PostgreSQL Row Level Security pour les tables tenantées lorsque pertinent.

RLS forcée.

Le rôle applicatif ne doit pas être propriétaire des tables.

Le rôle applicatif ne doit jamais avoir :

```text
BYPASSRLS
```

L’accès tenant doit être établi explicitement dans le contexte transactionnel.

---

# 23. PRINCIPE DE CLOISONNEMENT

L’exigence absolue est :

> Un client A ne peut jamais lire, modifier ou déduire l’existence d’une donnée du client B.

Même en cas :

* d’URL modifiée manuellement
* de mauvais identifiant envoyé
* d’appel direct API
* de bug dans l’interface
* de tentative d’accès via webhook
* de tâche asynchrone défectueuse

L’isolation doit exister à plusieurs niveaux.

---

# 24. DEFENSE IN DEPTH

Le cloisonnement ne doit pas dépendre uniquement de l’UI.

Protection :

```text
UI
↓
authorization
↓
service métier
↓
requête tenantée
↓
PostgreSQL RLS
```

Plusieurs couches doivent empêcher une fuite.

---

# 25. RÔLES INITIAUX

### OWNER

Propriétaire de l’organisation.

### MEMBER

Collaborateur.

### PLATFORM_ADMIN

Administration Tony.

Prévoir dès l’architecture l’ajout futur de :

* manager
* dispatcher
* secretary
* technician
* custom roles

Ne pas construire immédiatement un moteur de permissions aussi complexe que Pilotage.

---

# 26. ADMINISTRATION TONY

Le rôle plateforme doit être complètement séparé des rôles client.

Toute consultation d’un tenant par un PLATFORM_ADMIN doit être auditée.

Aucun « mode admin magique » sans journalisation.

---

# 27. AUDIT

Réutiliser le principe d’audit append-only de Pilotage.

Auditer notamment :

* connexion administrateur
* modification paramètres sensibles
* accès admin à un tenant
* modification automatisation
* changement abonnement
* changement numéro
* suppression données
* export
* changement permissions

L’audit ne doit pas pouvoir être modifié par l’utilisateur standard.

---

# 28. ENTITÉS PRINCIPALES

Prévoir notamment :

```text
Organization
OrganizationSettings
CountryConfiguration

User
Membership

PhoneLine
PhoneConfiguration

Contact
ContactAddress

InboundRequest

Opportunity
OpportunityScore
OpportunityScoreVersion

ServiceTemplate
ServiceCategory

Call
CallParticipant
CallProviderEvent

Transcript
TranscriptSegment
CallSummary

Message
MessageTemplate

FormTemplate
FormField
FormSubmission
Attachment

Task
Appointment

AutomationRule
AutomationExecution

Referral

Subscription
UsageEvent

WebhookEvent

AuditLog

SupportConversation
SupportDiagnostic
```

---

# 29. CONTACT

Le téléphone constitue l’identifiant naturel principal d’un contact.

Normaliser les numéros au format E.164.

Ne jamais utiliser le numéro brut comme clé primaire.

Un même numéro peut appeler plusieurs fois.

Tony doit reconnaître automatiquement le contact existant.

---

# 30. OPPORTUNITY

Chaque demande suffisamment pertinente crée une opportunité.

États proposés :

```text
NEW
QUALIFYING
TO_CONTACT
CONTACTED
WAITING_CUSTOMER
TO_SCHEDULE
TO_ESTIMATE
PROPOSAL_SENT
WON
LOST
ARCHIVED
```

L’utilisateur ne doit pas obligatoirement voir toute cette complexité.

L’interface peut afficher :

```text
À traiter
En attente
Planifié
Gagné
Perdu
```

---

# 31. CATALOGUE DE PRESTATIONS

Chaque professionnel configure ses principales prestations.

Exemple :

```text
Remplacement chauffe-eau

Valeur moyenne : 1 200 €
Fourchette : 900 à 1 700 €
Durée : 4 heures
Difficulté : moyenne
Intérêt commercial : élevé
Zone maximale : 30 km
```

Tony utilise ce catalogue comme source de vérité.

L’IA ne doit pas inventer les prix.

---

# 32. OPPORTUNITY ENGINE

Cœur différenciant de Tony.

L’IA extrait les informations.

Le moteur métier détermine la priorité.

Ne jamais laisser un LLM calculer arbitrairement le score final.

---

# 33. DIMENSIONS DU SCORE

Première version :

```text
economicPotential
effort
distance
urgency
conversionProbability
strategicFit
scheduleFit
customerValue
```

Chaque dimension doit pouvoir être comprise séparément.

---

# 34. SCORE GLOBAL

Tony peut générer :

```text
0 à 100
```

Mais l’interface privilégie :

```text
Priorité très élevée
Priorité élevée
À traiter
Peut attendre
Faible priorité
```

---

# 35. SCORE VERSIONNÉ

Chaque calcul conserve :

```text
scoreVersion
```

Exemple :

```text
1.0
```

Si la formule change, les anciens scores ne doivent pas être silencieusement réinterprétés.

---

# 36. EXPLICABILITÉ

Tony doit être capable de dire :

> Priorité élevée car ce chantier correspond à une prestation que vous privilégiez, se situe à 4 km, représente environ 2 500 € et peut être réalisé dans votre disponibilité de jeudi.

Pas seulement :

> Score 87.

---

# 37. IA

Créer une couche :

```text
AIProvider
```

L’implémentation initiale peut utiliser OpenAI.

Ne jamais appeler directement OpenAI depuis les composants UI.

---

# 38. FONCTIONS IA

Exemples :

```text
transcribeAudio()
classifyInboundRequest()
extractCallInformation()
summarizeCall()
extractCommitments()
extractTasks()
suggestNextAction()
detectLanguage()
supportDiagnostic()
```

---

# 39. PROMPTS

Tous les prompts doivent être :

* centralisés
* versionnés
* documentés
* testables

Exemples :

```text
CALL_EXTRACTION_V1
OPPORTUNITY_CLASSIFICATION_V1
CALL_SUMMARY_V1
SUPPORT_DIAGNOSTIC_V1
```

Ne pas laisser des prompts dispersés dans le code.

---

# 40. STRUCTURED OUTPUT

L’IA doit retourner autant que possible des données structurées.

Validation Zod obligatoire.

Si validation échoue :

1. retry contrôlé
2. journalisation
3. fallback fonctionnel

Jamais de crash du workflow métier.

---

# 41. FALLBACK IA

Si l’IA tombe :

Tony doit continuer à :

* recevoir l’appel
* créer le contact
* créer la demande
* envoyer le SMS
* enregistrer l’opportunité

Afficher :

> Qualification en cours.

Puis permettre un retry.

---

# 42. CONFIANCE

Conserver une confiance lorsque pertinente.

Exemple :

```text
serviceClassificationConfidence: 0.92
```

Une donnée incertaine ne doit pas déclencher une automatisation sensible.

---

# 43. TÉLÉPHONIE

Créer :

```text
TelephonyProvider
```

Provider initial probable :

**Twilio**

Mais le domaine métier ne doit jamais dépendre directement de Twilio.

Préparer la possibilité future de :

```text
TelnyxTelephonyProvider
```

---

# 44. RESPONSABILITÉS DU TELEPHONY PROVIDER

Exposer notamment :

```text
provisionNumber()
releaseNumber()
makeOutboundCall()
sendSms()
getCall()
startRecording()
stopRecording()
deleteRecording()
verifyWebhook()
```

---

# 45. NUMÉROS

Tony fournit initialement les numéros téléphoniques.

Ne pas dépendre de la portabilité du numéro personnel du professionnel.

Cela réduit fortement le risque réglementaire et fournisseur.

---

# 46. APPEL MANQUÉ

Workflow :

```text
Prospect appelle
↓
Professionnel ne répond pas
↓
Événement provider
↓
Tony valide le webhook
↓
Événement stocké
↓
Contact identifié/créé
↓
InboundRequest
↓
SMS
↓
Formulaire
↓
Qualification
↓
Opportunity
```

---

# 47. IDEMPOTENCE

Tous les événements fournisseurs doivent être idempotents.

Un webhook reçu trois fois doit produire une seule conséquence métier.

Pas :

* trois leads
* trois SMS
* trois tâches

---

# 48. SMS

Le message doit être configurable.

Exemple :

> Bonjour, vous venez d’essayer de nous joindre. Je suis actuellement en intervention. Vous pouvez préciser votre demande ici : [lien]

Le lien doit être :

* signé
* difficilement devinable
* limité dans le temps si pertinent
* associé à la demande

---

# 49. FORMULAIRE PROSPECT

Mobile first.

Aucun compte.

Aucun mot de passe.

Questions dynamiques.

Exemples :

* nature du besoin
* urgence
* adresse
* échéance
* photos
* disponibilités
* description

---

# 50. FORM BUILDER

Ne pas coder tous les formulaires en dur.

Prévoir :

```text
FormTemplate
FormField
```

afin d’adapter facilement les questions selon :

* métier
* pays
* prestation

---

# 51. APPELS SORTANTS

Depuis une opportunité :

> Appeler

L’appel doit pouvoir passer depuis Tony.

Cela permet :

* rattachement automatique
* historique
* transcription
* résumé
* mise à jour CRM

---

# 52. TRANSCRIPTION

V1 recommandée :

```text
appel
↓
enregistrement temporaire
↓
fin appel
↓
job transcription
↓
transcript
↓
validation
↓
suppression audio
```

L’audio n’est pas un actif du produit.

Il doit être supprimé rapidement.

---

# 53. AUDIO

Ne pas exposer le téléchargement audio en V1.

Suivre explicitement :

```text
audioDeletionStatus
```

États :

```text
PENDING
DELETED
DELETE_FAILED
```

Un `DELETE_FAILED` doit provoquer une alerte.

---

# 54. TRANSCRIPT

Le transcript peut être conservé selon la politique de rétention.

Il doit être rattaché :

* au tenant
* au contact
* à l’appel
* à l’opportunité

---

# 55. CONVERSATION VERS ACTION

Après chaque appel, Tony doit pouvoir produire :

```text
Résumé
Besoin
Prestation probable
Urgence
Localisation
Échéance
Budget éventuel
Engagements
Tâches
Prochaine action
```

---

# 56. ENGAGEMENTS

Exemple :

> Je vous envoie le devis demain.

Créer automatiquement :

```text
Task
SEND_ESTIMATE
dueDate = tomorrow
```

---

# 57. AUTOMATISATIONS

Niveaux :

### Niveau 0

aucune action automatique

### Niveau 1

Tony propose

### Niveau 2

Tony exécute des règles simples

### Niveau 3

automatisations avancées

V1 :

principalement Niveau 1 et quelques Niveau 2.

---

# 58. LIMITES DE L’AUTOMATISATION

Tony ne doit pas envoyer automatiquement sans configuration explicite :

* prix engageant
* devis
* promesse contractuelle
* engagement irréversible

---

# 59. PLANNING

Créer un planning interne simple.

```text
Appointment
start
end
location
contactId
opportunityId
status
```

Pas besoin d’une intégration Google Calendar dans la première version.

Architecture compatible plus tard.

---

# 60. GÉOGRAPHIE

Provider abstrait :

```text
MapsProvider
```

Permettre :

* geocoding
* distance
* durée de trajet

Première version :

distance depuis la base du professionnel.

Version suivante :

distance depuis les interventions déjà prévues.

---

# 61. ROI

Trois métriques distinctes :

```text
potentialValue
declaredWonValue
attributedWonValue
```

Ne jamais présenter une estimation comme du chiffre d’affaires réel.

---

# 62. ONBOARDING

Objectif :

moins de 10 minutes.

Étapes possibles :

1. compte
2. entreprise
3. métier
4. zone
5. horaires
6. prestations
7. valeurs indicatives
8. configuration téléphonique
9. message automatique
10. test
11. dashboard

---

# 63. PREMIER MOMENT DE VALEUR

L’utilisateur doit pouvoir faire un test pendant l’onboarding.

Simulation :

```text
appel
↓
appel manqué
↓
SMS
↓
formulaire
↓
opportunité
```

Le mode test doit être clairement séparé des vraies statistiques.

---

# 64. BILLING

Créer :

```text
BillingProvider
```

Provider envisagé :

Stripe Billing.

Plans et tarifs configurables.

Ne rien hardcoder.

---

# 65. USAGE

Tracer :

* numéros
* appels
* minutes
* SMS
* transcription
* IA
* stockage

Chaque événement de consommation :

```text
UsageEvent
```

---

# 66. MARGE

L’architecture doit permettre de connaître :

> coût technologique réel de chaque tenant.

Exemples :

```text
Telephony cost
SMS cost
Transcription cost
AI cost
Storage cost
```

---

# 67. PARRAINAGE

Prévoir dès le modèle de données :

```text
Referral
ReferralCode
ReferralReward
```

Le filleul n’est considéré comme converti qu’après le premier paiement valide.

---

# 68. SUPPORT IA

Tony doit tendre vers un support presque entièrement automatisé.

L’assistant doit pouvoir consulter, sous contrôle strict :

* documentation
* paramètres du tenant
* statut téléphonie
* appels
* événements
* SMS
* jobs
* erreurs
* abonnement

---

# 69. SUPPORT DIAGNOSTIQUE

Exemple :

> Pourquoi mon prospect n’a pas reçu le SMS ?

Tony doit pouvoir répondre :

> L’appel de 14h32 a été décroché après 8 secondes et n’a donc pas été considéré comme manqué.

Pas seulement afficher une FAQ.

---

# 70. DROITS DU SUPPORT IA

Par défaut :

lecture uniquement.

Une action de modification doit demander confirmation.

Chaque action doit être auditée.

---

# 71. BACK-OFFICE TONY

Créer un back-office interne de qualité.

Il doit permettre de consulter :

* organisations
* utilisateurs
* abonnements
* lignes téléphoniques
* appels
* messages
* webhooks
* transcriptions
* jobs
* coûts
* erreurs
* support

---

# 72. PERFORMANCE

La performance est une exigence produit.

Objectifs indicatifs :

### Navigation courante

Perception quasi instantanée.

### Requêtes principales

P95 serveur cible :

```text
< 500 ms
```

lorsqu’aucun fournisseur externe n’est impliqué.

### Actions simples

Feedback utilisateur immédiat.

### Pages importantes

LCP cible en production :

```text
< 2.5 s
```

sur réseau mobile raisonnable.

---

# 73. PERFORMANCE DATABASE

Toujours prévoir :

* index
* pagination
* sélection de colonnes utile
* absence de N+1
* requêtes explicables
* limites de résultat

Éviter les gros `include` Prisma non maîtrisés.

---

# 74. LISTES

Pas de chargement de 10 000 contacts côté navigateur.

Utiliser :

* pagination
* cursor pagination si pertinent
* recherche serveur
* filtres serveur

---

# 75. TRAITEMENTS LENTS

Aucun traitement lourd dans le chemin critique d’une requête web.

Déporter :

* transcription
* analyse IA
* génération de résumé
* recalculs importants
* envoi de certains messages

vers des jobs.

---

# 76. JOBS

Réutiliser l’approche robuste de Pilotage.

Jobs PostgreSQL avec :

* lease
* retries
* backoff
* idempotence
* statut
* erreurs
* dead-letter logique

Éviter Redis en V1 sauf nécessité démontrée.

---

# 77. CACHE

Ne pas introduire un cache complexe avant d’en avoir besoin.

Optimiser d’abord :

* indexes
* requêtes
* pagination
* prefetch
* rendering

Ajouter un cache seulement après mesure.

---

# 78. OBSERVABILITÉ

Chaque workflow important doit avoir un :

```text
correlationId
```

Exemple :

```text
appel
↓
webhook
↓
SMS
↓
formulaire
↓
opportunité
↓
transcript
```

doit être retraçable.

---

# 79. LOGS

Logs structurés.

Ne jamais logger inutilement :

* secrets
* audio
* transcripts complets
* tokens
* données personnelles

---

# 80. MONITORING

Prévoir un outil type Sentry pour :

* exceptions
* performance
* traces
* alertes

---

# 81. ALERTES

Créer des alertes sur :

* hausse erreurs téléphonie
* SMS échoués
* webhook rejeté
* jobs bloqués
* transcription échouée
* suppression audio échouée
* erreur paiement
* coût anormal
* taux d’erreur élevé

---

# 82. HEALTH

Prévoir :

```text
/health
/readiness
```

permettant de vérifier le bon fonctionnement de l’application.

---

# 83. SÉCURITÉ

Réutiliser les principes exigeants de Pilotage.

Objectif :

architecture pouvant s’inscrire plus tard dans une démarche ISO 27001.

Tony ne doit évidemment jamais prétendre être certifié tant que ce n’est pas le cas.

---

# 84. PRINCIPES SÉCURITÉ

* least privilege
* secure by default
* privacy by design
* defense in depth
* traçabilité
* isolation tenant
* minimisation des données

---

# 85. AUTHENTIFICATION

Prévoir :

* hash moderne
* sessions révocables
* cookies Secure
* HttpOnly
* SameSite approprié
* email verification
* reset password
* protections brute force
* rate limiting

Architecture compatible MFA.

---

# 86. MFA

MFA non indispensable pour tous les artisans au lancement.

En revanche :

* PLATFORM_ADMIN doit pouvoir être soumis au MFA
* architecture Better Auth compatible dès le départ

---

# 87. SECRETS

Aucun secret dans Git.

Créer :

```text
.env.example
```

Validation des variables d’environnement au démarrage.

---

# 88. CI SÉCURITÉ

Réutiliser les contrôles de Pilotage :

* CodeQL
* Dependency Review
* Dependabot
* secret scanning
* dependency scanning
* npm audit

---

# 89. INPUT SECURITY

Toutes les entrées :

* API
* formulaire
* webhook
* IA
* URL params

doivent être validées.

---

# 90. RATE LIMITING

Prévoir des limites spécifiques sur :

* login
* reset password
* formulaires publics
* endpoints téléphone
* support IA
* appels coûteux

---

# 91. FILE UPLOADS

Photos possibles.

Restrictions :

* taille
* MIME
* extension
* nombre
* noms générés côté serveur

Stockage privé.

URLs temporaires signées.

---

# 92. DONNÉES PERSONNELLES

Considérer comme personnelles :

* nom
* téléphone
* email
* adresse
* transcripts
* messages
* photos

Minimiser la conservation.

---

# 93. RETENTION

Prévoir une politique configurable.

Exemple :

audio :

très courte durée

transcript :

durée configurée

prospects anciens :

archivage ou anonymisation future

---

# 94. DROITS RGPD

Architecture permettant :

* export
* rectification
* suppression
* anonymisation

La totalité des interfaces n’est pas nécessaire en Lot 1.

---

# 95. WEBHOOKS

Chaque webhook doit :

1. vérifier la signature
2. valider le payload
3. stocker l’événement
4. vérifier l’idempotence
5. répondre rapidement
6. traiter ensuite en job si nécessaire

---

# 96. BACKUP

La future production devra supporter :

* backups automatiques
* restauration
* point-in-time recovery

Une restauration réelle doit être testée avant lancement commercial significatif.

---

# 97. DÉPLOIEMENT

Développement initial :

**local**

Créer une expérience reproductible.

Commande simple pour lancer :

* application
* PostgreSQL
* worker

---

# 98. DOCKER

Créer :

```text
Dockerfile
docker-compose.yml
```

L’application doit pouvoir fonctionner dans un environnement Node standard.

Ne pas dépendre exclusivement de Vercel.

---

# 99. HÉBERGEMENT FUTUR

Tony ne nécessite pas HDS.

On peut conserver la philosophie de déploiement de Pilotage, mais utiliser un hébergement SaaS standard européen.

Le choix du fournisseur sera réalisé avant mise en production.

L’architecture doit être portable.

---

# 100. FOURNISSEURS MOCK

Le développement local ne doit pas consommer inutilement les APIs.

Créer :

```text
FakeTelephonyProvider
FakeAIProvider
FakeBillingProvider
FakeMapsProvider
FakeEmailProvider
```

---

# 101. TESTS

La culture de tests de Pilotage doit être conservée.

---

# 102. TESTS UNITAIRES

Tester particulièrement :

* scoring
* money
* règles commerciales
* permissions
* calculs d’usage
* transitions d’état
* automatisations

---

# 103. TESTS POSTGRESQL

Créer de vrais tests contre PostgreSQL.

Ne pas se contenter d’une base mockée.

---

# 104. TESTS RLS

Tests obligatoires :

```text
Tenant A cannot read Tenant B
Tenant A cannot update Tenant B
Tenant A cannot delete Tenant B
```

Sur toutes les tables sensibles.

---

# 105. TESTS WEBHOOK

Tester :

* doublons
* mauvais ordre
* signature invalide
* retry
* événement ancien
* payload incorrect

---

# 106. TESTS TÉLÉPHONIE

Cas minimum :

* appel répondu
* appel manqué
* appel très court
* appel simultané
* même numéro plusieurs fois
* SMS échec
* provider indisponible

---

# 107. TESTS IA

Tester :

* JSON valide
* JSON invalide
* timeout
* erreur provider
* données contradictoires
* faible confiance

---

# 108. TESTS E2E

Parcours minimum :

### Flow 1

signup → onboarding → dashboard

### Flow 2

appel manqué simulé → SMS → formulaire → opportunité

### Flow 3

appel → transcript → résumé → task

### Flow 4

tenant A ne peut jamais accéder à tenant B

---

# 109. CI

À chaque PR :

```text
lint
typecheck
unit tests
integration tests
RLS tests
build
```

E2E sur les branches appropriées.

---

# 110. MIGRATIONS

Règles strictes.

Favoriser :

* migration additive
* backfill
* validation
* suppression seulement après transition

Pas de migration destructive non préparée.

---

# 111. CODING RULES

* TypeScript strict
* pas de `any` sans justification
* Zod aux frontières
* argent en unités mineures
* téléphone E.164
* dates UTC
* IDs non prédictibles
* logique métier hors composants
* composants raisonnablement petits
* fonctions raisonnablement petites
* commentaires expliquant le pourquoi et non l’évidence

---

# 112. DOMAIN SERVICES

L’UI ne doit jamais devenir propriétaire de la logique métier.

Exemple :

mauvais :

```text
React component
→ Prisma
```

correct :

```text
React
→ action/API
→ domain service
→ repository
→ database
```

---

# 113. DESIGN SYSTEM

Créer un design system Tony dès les premiers lots.

Variables principales :

* spacing
* typography
* radii
* shadows
* semantic colors
* status
* form controls
* buttons
* cards
* drawers
* dialogs
* alerts

Ne pas multiplier les composants légèrement différents.

---

# 114. STYLE VISUEL

Tony doit donner une impression :

* moderne
* chaleureux
* professionnel
* rassurant
* simple
* énergique sans être ludique excessivement

Éviter :

* esthétique « dashboard IA générique »
* gradients partout
* cartes partout
* trop de couleurs
* icônes décoratives inutiles
* interfaces trop denses

---

# 115. COPYWRITING

Privilégier :

> Rappeler

plutôt que :

> Initier une interaction téléphonique.

Privilégier :

> En attente du client

plutôt que :

> Pending customer action.

Toujours penser à l’artisan.

---

# 116. EMPTY STATES

Chaque écran vide doit aider l’utilisateur.

Pas :

> Aucun élément.

Mais par exemple :

> Vous n’avez encore aucune opportunité. Dès qu’une demande arrive, Tony l’affichera ici.

---

# 117. LOADING

Utiliser :

* optimistic UI lorsque sûr
* skeletons
* progressive loading

Éviter les spinners plein écran.

---

# 118. ACCESSIBILITÉ

Respecter autant que raisonnablement possible WCAG 2.2 AA.

Notamment :

* clavier
* focus
* labels
* contraste
* aria
* tailles tactiles
* erreurs formulaires

---

# 119. DOCUMENTATION

Créer dès Lot 0 :

```text
README.md
AGENTS.md

docs/
  ARCHITECTURE.md
  DATA_MODEL.md
  SECURITY.md
  MULTI_TENANCY.md
  RLS.md
  TELEPHONY.md
  AI.md
  INTERNATIONALIZATION.md
  DESIGN_SYSTEM.md
  PERFORMANCE.md
  BILLING.md
  RUNBOOKS.md

docs/adr/
```

---

# 120. AGENTS.MD

AGENTS.md doit devenir la constitution Codex de Tony.

Il doit rappeler :

* vision produit
* structure
* conventions
* sécurité
* RLS
* i18n
* provider abstractions
* tests
* règles migrations
* modèles recommandés
* interdictions

Codex doit le lire avant toute évolution importante.

---

# 121. PRINCIPES CODEX

Avant toute modification substantielle :

1. inspecter l’existant
2. lire AGENTS.md
3. identifier les modules concernés
4. identifier les risques
5. proposer un plan
6. implémenter
7. tester
8. vérifier absence de régression
9. documenter

---

# 122. MODÈLES CODEX

Utiliser le modèle le moins coûteux compatible avec la qualité requise.

## Luna

Pour :

* texte
* petite correction CSS
* label
* espacement
* modification UI triviale
* test très local

## Terra

Pour :

* CRUD standard
* composants classiques
* formulaire borné
* refactor limité
* tests simples

## Sol

Modèle principal.

Pour :

* fonctionnalités substantielles
* backend
* Prisma
* APIs
* jobs
* téléphonie
* IA
* business logic
* migrations
* architecture

Medium par défaut.

High pour les tâches difficiles.

## Astra

Réserver à :

* sécurité critique
* RLS
* architecture transverse
* migration dangereuse
* incident complexe
* refactor profond
* revue préproduction importante

Ne pas utiliser Astra pour une simple évolution d’interface.

---

# 123. RÈGLE DE CONSOMMATION CODEX

Ne jamais :

* utiliser systématiquement le meilleur modèle
* relancer dix fois un modèle trop faible
* utiliser Astra par confort

Escalade :

```text
Luna/Terra
↓
Sol Medium
↓
Sol High
↓
Astra
```

selon difficulté réelle.

---

# 124. LOT 0

## Fondation

Objectif :

créer un repository propre.

Livrables :

* Next.js
* React
* TypeScript strict
* PostgreSQL local
* Prisma
* Zod
* Vitest
* Playwright
* Docker
* CI
* lint
* typecheck
* docs
* AGENTS.md
* ADR
* i18n foundation
* design tokens

Aucune vraie fonctionnalité métier.

### Validation

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

doivent passer.

### Codex

Sol Medium.

---

# 125. LOT 1

## Multi-tenant, Auth, RLS et sécurité

Construire :

* Better Auth
* User
* Organization
* Membership
* OWNER
* MEMBER
* PLATFORM_ADMIN
* RLS
* rôle PostgreSQL applicatif sans BYPASSRLS
* audit foundation
* tenant context
* sessions

### Validation

Tests directs RLS.

Tests cross-tenant.

### Codex

Sol High.

Revue finale Astra recommandée.

---

# 126. LOT 2

## Design system et shell applicatif

Créer :

* navigation mobile
* navigation desktop
* layout
* header
* cards
* buttons
* forms
* modals
* drawers
* states
* typography
* skeletons
* empty states

Créer les principaux écrans sans logique complète.

### Codex

Sol Medium.

Luna pour corrections finales ponctuelles.

---

# 127. LOT 3

## CRM minimal

Créer :

* Contact
* Opportunity
* ServiceTemplate
* Task

Écrans :

* Aujourd’hui
* Opportunités
* Contacts
* Prestations
* Paramètres

Providers externes mockés.

### Codex

Sol Medium.

---

# 128. LOT 4

## Opportunity Engine V1

Construire :

* dimensions
* pondérations
* versioning
* explication
* tests métiers

Pas encore besoin de vraie IA.

Créer des données simulées.

### Codex

Sol High.

Revue Astra recommandée.

---

# 129. LOT 5

## POC Twilio

Créer une branche/zone expérimentale contrôlée.

Valider réellement :

* numéro
* appel entrant
* webhook
* appel manqué
* SMS
* appel sortant
* enregistrement
* suppression audio

Documenter chaque comportement fournisseur.

### Codex

Sol High.

---

# 130. GATE 1

Ne pas continuer la dépendance téléphonique tant que le POC n’est pas validé.

Résultat attendu :

> Une vraie ligne Tony peut recevoir un appel et remonter correctement son état.

---

# 131. LOT 6

## Appel manqué vers opportunité

Workflow :

```text
appel
↓
manqué
↓
SMS
↓
formulaire
↓
contact
↓
opportunité
```

Construire :

* idempotence
* retry
* jobs
* logging
* correlation
* modes d’erreur

### Codex

Sol High.

---

# 132. GATE 2

Tester sur de vrais téléphones.

Cas :

* même numéro deux fois
* appels simultanés
* webhook dupliqué
* utilisateur déjà connu
* formulaire abandonné
* SMS échoué

---

# 133. LOT 7

## Appels sortants depuis Tony

Construire :

* bouton Appeler
* WebRTC si retenu
* rattachement contact
* rattachement opportunity
* call history
* événements

### Codex

Sol High.

---

# 134. LOT 8

## Transcription

Construire :

* enregistrement temporaire
* job transcription
* AIProvider
* transcript
* suppression audio
* retries
* monitoring

### Validation critique

Aucun audio ne doit rester silencieusement en état indéfini.

### Codex

Sol High.

Revue sécurité Astra.

---

# 135. LOT 9

## Intelligence conversationnelle

Transcript vers :

* résumé
* service
* urgency
* constraints
* commitment
* tasks
* next action

Structured output uniquement.

### Codex

Sol Medium ou High.

---

# 136. LOT 10

## Opportunity Engine connecté aux vraies données

Relier :

* formulaire
* transcription
* catalogue
* localisation
* historique

au scoring déterministe.

### Codex

Sol High.

---

# 137. GATE 3

Tony doit être capable de recevoir cinq demandes différentes et de produire :

* cinq opportunités
* cinq scores
* un classement cohérent
* une explication pour chaque priorité

---

# 138. LOT 11

## Planning et géographie

Construire :

* Appointment
* agenda simple
* adresse
* geocoding
* distance
* schedule fit

### Codex

Sol Medium.

---

# 139. LOT 12

## Automatisations

Créer :

* AutomationRule
* AutomationExecution
* action suggestions
* relances
* demandes de photos
* propositions de créneaux

V1 avec validation humaine importante.

### Codex

Sol High.

---

# 140. LOT 13

## Onboarding

Objectif :

activation en moins de 10 minutes.

Inclure :

* métier
* zone
* horaires
* prestations
* téléphone
* SMS
* test

Instrumenter chaque étape.

### Codex

Sol Medium.

---

# 141. LOT 14

## Reporting ROI

Construire :

* potential value
* won value
* attributed value
* activity recap
* weekly recap
* monthly recap

Très forte exigence UX.

### Codex

Sol Medium.

---

# 142. LOT 15

## Billing

Stripe.

Construire :

* trial
* plan
* quota
* abonnement
* cancel
* failed payment
* grace period
* usage metering

### Codex

Sol High.

---

# 143. LOT 16

## Parrainage

Construire :

* referral code
* attribution
* reward
* règles anti-abus
* crédit après paiement

### Codex

Sol Medium.

---

# 144. LOT 17

## Back-office Tony

Construire :

* organisations
* utilisateurs
* abonnements
* calls
* SMS
* jobs
* costs
* webhooks
* alerts

Back-office traduit.

### Codex

Sol High.

---

# 145. LOT 18

## Support IA

Construire support diagnostic.

D’abord lecture seule.

L’IA doit pouvoir répondre à une question liée à un événement précis.

### Codex

Sol High.

---

# 146. LOT 19

## Internationalisation complète du produit

Vérifier :

* aucun texte UI hardcodé
* formats date
* devises
* timezone
* pays
* téléphone
* templates SMS
* emails
* back-office

Ajouter langue anglaise comme deuxième langue de validation.

Même si Tony n’est commercialisé qu’en France.

### Codex

Sol Medium.

---

# 147. LOT 20

## Hardening

Avant vraie commercialisation :

* revue RLS
* auth review
* dependency audit
* rate limiting
* backup
* restore
* load testing
* performance audit
* webhook replay
* incident simulation
* mobile testing
* accessibility
* monitoring

### Codex

Astra.

---

# 148. LOT 21

## Bêta terrain

5 à 10 vrais professionnels.

Mesurer :

* installation
* appels
* leads
* SMS
* formulaires
* appels rappelés
* transcriptions
* scores
* actions
* ROI
* bugs
* compréhension UX

Ne pas ajouter immédiatement de nouvelles fonctionnalités.

Prioriser :

1. bugs
2. friction
3. incompréhension
4. fiabilité
5. fonctionnalité

---

# 149. LOT 22

## Préproduction

Avant ouverture plus large :

* environnement production
* domaine
* TLS
* secrets
* monitoring
* backups
* Stripe production
* Twilio production
* mails production
* politique de confidentialité
* CGU
* mentions légales
* procédures incident

---

# 150. OBJECTIFS DE PERFORMANCE AVANT LANCEMENT

Effectuer des tests de charge sur :

* login
* Today dashboard
* opportunity list
* contact search
* webhook intake
* job processing
* SMS workflow

Objectif initial :

supporter largement plus que le trafic prévu pour les 1 000 premiers clients.

Pas besoin de concevoir immédiatement pour 10 millions de comptes.

---

# 151. ÉVOLUTIVITÉ

Tony doit pouvoir passer progressivement de :

```text
France
100 clients
1 métier
```

à :

```text
plusieurs pays
plusieurs langues
plusieurs milliers de clients
plusieurs professions
```

sans réécriture fondamentale.

L’évolutivité recherchée est surtout :

* fonctionnelle
* géographique
* fournisseur
* organisationnelle

Pas une architecture distribuée prématurée.

---

# 152. FEATURE FLAGS

Prévoir un mécanisme simple de feature flags.

Permettre :

* activation par environnement
* activation par tenant
* progressive rollout

Très utile pour :

* agent vocal
* nouvelles automatisations
* nouveau scoring
* nouveaux pays

---

# 153. CONFIGURATION MÉTIER

Ne jamais écrire :

```text
if plumber
```

partout dans le code.

Créer une configuration métier.

Exemple :

```text
TradeConfiguration
```

pour gérer :

* catégories de prestations
* questions
* règles
* templates

Le cœur Tony doit rester générique.

---

# 154. PAS DE CODE CLIENT

Même principe que Pilotage.

Ne jamais introduire :

```text
if organizationName === "Entreprise X"
```

Une différence client doit être :

* configuration
* entitlement
* feature flag
* template

---

# 155. OBSERVABILITÉ PRODUIT

Instrumenter dès le début :

```text
signup
onboarding_started
onboarding_completed
phone_configured
first_test_completed
first_inbound_call
first_missed_call
first_sms_sent
first_form_completed
first_opportunity
first_outbound_call
first_transcript
first_task
first_won_opportunity
trial_converted
referral_created
referral_converted
```

---

# 156. MÉTRIQUE D’ACTIVATION

Premier candidat :

> Première opportunité réelle qualifiée par Tony.

Métrique encore plus forte :

> Première opportunité gagnée provenant d’une demande gérée par Tony.

---

# 157. NORTH STAR

Tony ne doit pas optimiser :

> nombre d’appels traités.

Tony doit optimiser quelque chose de plus proche de :

> valeur des opportunités récupérées et converties avec Tony.

---

# 158. CE QUI N’EST PAS DANS LA V1

Ne pas construire :

* comptabilité
* paie
* stocks
* gestion fournisseurs
* achats
* ERP
* devis réglementaire complet
* facturation électronique
* gestion de flotte
* connecteur HubSpot
* connecteur Salesforce
* app iOS native
* app Android native
* optimisation complexe des tournées

---

# 159. AGENT VOCAL

L’architecture doit permettre plus tard :

```text
SMS_ONLY
VOICE_AGENT
HYBRID
```

Mais l’agent vocal sophistiqué ne doit pas retarder la V1.

La vraie valeur Tony est ailleurs.

---

# 160. PRINCIPES DE REVUE APRÈS CHAQUE LOT

Codex doit terminer chaque lot par :

```text
Résumé
Fichiers modifiés
Décisions prises
Migrations
Tests ajoutés
Tests exécutés
Résultats
Tests manuels nécessaires
Risques résiduels
Dette éventuelle
Impact sécurité
Impact performance
Impact i18n
Rollback
Prochain lot
```

---

# 161. DEFINITION OF DONE

Une fonctionnalité n’est pas terminée lorsque :

> l’écran fonctionne sur ma machine.

Elle est terminée lorsque :

* code propre
* typed
* validation
* permissions
* tenant isolation
* erreurs
* tests
* responsive
* i18n compatible
* logs
* documentation
* migration
* rollback si nécessaire
* pas de régression

---

# 162. RÈGLE SUR LES BUGS

Pour chaque bug significatif :

1. reproduire
2. trouver la cause racine
3. corriger
4. écrire un test de régression
5. vérifier les cas proches

Ne jamais multiplier les patches superficiels.

---

# 163. PRIORITÉS ABSOLUES

Dans cet ordre :

1. sécurité
2. isolation client
3. intégrité des données
4. fiabilité
5. simplicité
6. maintenabilité
7. UX
8. performances
9. rapidité de développement
10. coût de tokens Codex

---

# 164. PRINCIPE FINAL

Tony doit être suffisamment simple pour qu’un plombier puisse le comprendre en quelques minutes.

Et suffisamment bien architecturé pour pouvoir devenir demain un SaaS international utilisé par plusieurs milliers de professionnels.

La complexité technique doit être cachée derrière une expérience extrêmement simple.

La vision peut être résumée ainsi :

```text
TONY

Capture les demandes
Comprend les besoins
Classe les opportunités
Aide à agir
Suit les engagements
Mesure le business généré
```

---

# 165. PREMIÈRE INSTRUCTION À CODEX

Ne pas construire Tony en une seule fois.

Commencer uniquement par le Lot 0.

Avant de coder :

1. lire intégralement ce brief
2. créer AGENTS.md
3. proposer l’architecture initiale
4. lister les décisions structurantes
5. identifier les risques
6. créer les ADR nécessaires
7. seulement ensuite initialiser le projet

Après Lot 0 :

arrêt obligatoire pour revue humaine.

Aucun Lot 1 ne doit être lancé avant validation du Lot 0.
