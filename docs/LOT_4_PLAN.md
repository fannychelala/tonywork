# Lot 4 — cadrage documentaire de l’Opportunity Engine V1

Date : 4 octobre 2026. **Lot 3 officiellement validé par revue humaine. Cadrage Lot 4 validé et implémentation explicitement autorisée par l’utilisateur.** Le corps du cadrage ci-dessous conserve sa formulation historique ; les propositions ont été acceptées comme calibration technique V1, sans validation empirique. Arrêt après Lot 4, aucun Lot 5/fusion/production. Aucun code, schéma, migration, test applicatif, provider ou dépendance n’est ajouté par ce document. Arrêt après ce cadrage et attente du feu vert explicite.

## Sources et lecture du périmètre

Brief complet v1.0 relu, ADR 0001–0008, AGENTS.md, modèle Prisma, docs/RLS.md et revue Lot 3 ; inspection du service CRM, validation et withTenant existants. Les gates Lot 3 acceptées constituent la référence historique : 19 unitaires, 89 PostgreSQL, 34 E2E et 6 répétitions de focus. Aucun de ces résultats n’est un résultat Lot 4.

Le brief §128 définit l’**Opportunity Engine V1** : dimensions, pondérations, versioning, explication et tests métiers sur données simulées, sans vraie IA. Les §32–36 imposent un moteur métier déterministe et explicable ; le §136 réserve au **Lot 10** son raccordement au formulaire, transcription, catalogue, localisation et historique réels. Le §28 cite OpportunityScore/OpportunityScoreVersion comme entités à prévoir, sans imposer leur création en Lot 4.

**Proposition à valider : Lot 4 = moteur pur et scénarios synthétiques, sans persistance ni surface HTTP/UI nouvelle.** Cette séparation évite d’inventer des informations manquantes du CRM Lot 3 et d’anticiper le Lot 10. Elle ne livre pas encore un classement des opportunités enregistrées dans Tony. Si une interface de simulation ou un historique SQL est souhaité dès ce lot, il faut réviser ce cadrage avant code, avec modèle tenanté, RLS et tests dédiés ; aucun ajout implicite.

## Livrables fonctionnels proposés

| Inclus Lot 4 | Comportement attendu |
|---|---|
| Contrat strict des huit dimensions | Valeurs synthétiques bornées et explicites ; données absentes distinctes des valeurs zéro |
| Fonction de calcul pure | Même entrée + même version → même sortie ; aucun accès DB, réseau, horloge, aléatoire, état partagé ou provider |
| Pondérations V1 | Profil technique commun, versionné dans le code ; aucune préférence client persistante |
| Résultat versionné | Valeurs normalisées, contributions, pondérations, score, niveau de priorité et codes d’explication ; calcul intégralement rejouable |
| Explications | Textes courts fr-FR/en-GB construits à partir des seules valeurs connues, sans LLM ni fait commercial inventé |
| Classement simulé | Au plus 100 scénarios synthétiques complets de même version ; ordre déterministe, égalités explicites |
| Données de validation | Au moins cinq demandes synthétiques contrastées, cas limites et cas incomplets, uniquement dans les fixtures de tests |
| Documentation | Formule, seuils, sémantique, limitations, exemples calculés et rapport Lot 4 après implémentation autorisée |

Pas de seed produit, bouton « Recalculer » CRM, badges de score sur les opportunités existantes, changement du tri d’Aujourd’hui ou dashboard analytique. Les simulations sont des fixtures, pas des statistiques ou données de démonstration injectées dans un tenant. Aucune action métier déclenchée par un score.

## Dimensions, normalisation et paramètres proposés

Le brief donne les noms mais pas les échelles, poids ou seuils. **Les paramètres suivants sont des propositions de calibration V1 à approuver, et non des exigences déjà fixées par le brief ni des probabilités empiriquement validées.**

Entrée : `source = SIMULATED`, identifiant de scénario synthétique borné, `scoreVersion = 1.0.0`, objet strict contenant exactement les huit clés ci-dessous. Chaque valeur est un entier 0–100 ou null. Aucune coercition de chaîne, NaN, infini, valeur hors borne, champ inconnu, UUID CRM, organizationId, nom, téléphone, email, adresse ou texte libre.

| Dimension | Sens de la valeur d’entrée synthétique | Utilité pour le score | Poids |
|---|---|---|---:|
| economicPotential | Indice de potentiel économique, pas un montant/CA | x | 25 % |
| effort | Indice de charge (durée/complexité agrégées simulées) | 100 − x | 15 % |
| distance | Indice de pénalité géographique, **pas des kilomètres** | 100 − x | 10 % |
| urgency | Indice d’urgence de traitement | x | 15 % |
| conversionProbability | Estimation simulée de conversion, non probabilité calibrée | x | 10 % |
| strategicFit | Compatibilité avec les préférences professionnelles simulées | x | 10 % |
| scheduleFit | Compatibilité de disponibilité simulée, sans agenda | x | 10 % |
| customerValue | Indice de relation/valeur client simulée, sans historique lu | x | 5 % |

Aucune conversion argent → indice en V1, comparaison EUR/GBP, géocodage, calcul de trajet, lecture de planning ou déduction depuis des coordonnées personnelles. Une forte urgence ne constitue pas un triage de sécurité ni une promesse de disponibilité. Les mappings depuis les sources réelles devront être définis et versionnés au Lot 10 ; ils ne sont pas simulés silencieusement dans le produit.

### Formule exacte

Poids entiers en points de base : 2500, 1500, 1000, 1500, 1000, 1000, 1000, 500 ; somme 10000. Pour chaque dimension connue, utilité u selon le tableau, numérateur de contribution `weightBasisPoints × u`.

Sur entrée complète : N = somme des huit numérateurs. Score en points de base 0–10000 : arrondi unique au plus proche de N/100, demi-valeur vers le haut. Aucun arrondi séparé des contributions avant agrégation. Avec ce profil, les numérateurs sont divisibles par 100 ; aucune imprécision flottante nécessaire. La valeur de présentation 0–100 se déduit du score entier et peut afficher deux décimales via Intl.

Priorité déterminée sur le score entier, avant présentation :

| Score 0–100 | Code | Libellé fr-FR |
|---|---|---|
| ≥80 | VERY_HIGH | Priorité très élevée |
| ≥65 et <80 | HIGH | Priorité élevée |
| ≥45 et <65 | NORMAL | À traiter |
| ≥25 et <45 | WAIT | Peut attendre |
| <25 | LOW | Faible priorité |

Les poids/seuils ne sont pas réglables par le client en Lot 4. Toute modification ultérieure de formule, sens d’une dimension, normalisation, poids, seuil ou règle d’explication nécessite une nouvelle version ; ne jamais réécrire la signification de 1.0.0.

### Donnée manquante et contradiction

Null signifie inconnue, jamais zéro/50 inventé. Si une dimension manque : résultat `INCOMPLETE`, score et priorité null, liste ordonnée des dimensions manquantes et des informations connues ; **pas de renormalisation des poids**, de classement provisoire ou de confiance inventée. Les scénarios incomplets sont présentés séparément des classables, sans ordre commercial entre eux.

Entrée invalide : erreur de validation structurée, aucun score, aucun fallback correctif silencieux. Des valeurs contrastées mais valides (fort potentiel et forte charge) sont expliquées comme un compromis, sans prétendre résoudre une contradiction factuelle. Aucun traitement de texte libre ni règle spécifique à un métier/client.

### Explication et classement

Sortie strictement typée : source simulée, scenarioId, scoreVersion, statut, scoreBasisPoints/priorité éventuels, snapshot des huit valeurs/poids/utilités/contributions et codes d’explication. Aucun token, identité, tenant ou PII.

Pour chaque dimension, produire un motif centralisé indiquant son sens, son utilité et sa contribution réelle. Résumé déterministe : utilité ≥70 = facteur favorable, ≤30 = facteur défavorable, sinon intermédiaire ; sélectionner au plus deux favorables et deux défavorables par poids décroissant puis ordre fixe des dimensions. Si aucun facteur d’une catégorie, ne pas en inventer. Expliquer les données manquantes. La contribution numérique est un terme du calcul, pas un effet causal prouvé ni un bénéfice en euros.

Classement : scores complets d’une même version décroissants en points de base ; égalités signalées, ordre technique stable par scenarioId sans priorité commerciale supplémentaire. Refuser mélange de versions, IDs dupliqués et liste >100 ; aucun classement multi-tenant ou chargement de toutes les opportunités. Changer la langue de présentation ne change jamais le score, les contributions ou le classement.

## Versioning et absence de persistance

La version 1.0.0 est un contrat immuable dans un registre de code fermé ; une version inconnue est refusée, sans alias implicite vers « latest ». Chaque résultat conserve la version et le snapshot de calcul en mémoire ; les fixtures de référence conservent entrée/version/sortie attendue pour rejouer les exemples historiques.

**Pas d’historique durable de calculs applicatifs dans ce lot.** Cette limite est explicite : les résultats de simulation ne survivent pas à la fin du processus, sauf fixtures synthétiques versionnées dans Git. Une correction affectant un résultat validé doit créer une nouvelle version, pas modifier les attentes historiques pour faire passer un test. Les sorties historiques de référence restent inchangées.

Les futures tables OpportunityScore/OpportunityScoreVersion et la conservation des snapshots métier seront à cadrer lors de l’intégration aux opportunités réelles au Lot 10. Cette proposition distingue versioning du moteur et conservation durable tenantée ; elle ne revendique pas cette dernière comme livrée.

## Tables, migrations, providers, dépendances et fichiers envisagés

| Élément | Proposition Lot 4 |
|---|---|
| Nouvelle table / colonne / FK / index | **Aucun** ; CRM et Organization.timeZone inchangés |
| Migration / backfill / seed | **Aucun** |
| Rôle/grant/politique SQL nouveaux | **Aucun** |
| Provider externe ou fake supplémentaire | **Aucun** ; le moteur ne nécessite même pas de FakeAIProvider |
| Dépendance / SDK / secret / service | **Aucun** ; TypeScript, Zod, Vitest et Intl existants suffisent |
| API/action/job/route/UI nouvelle | **Aucune** ; pas d’exposition d’un laboratoire de simulation au produit |
| Fichiers après autorisation | Module `src/modules/scoring/` pour contrat, profil, calcul, explications, classement ; dictionnaires typés dans `src/shared/i18n/` ; tests unitaires et fixtures synthétiques ; documentation et rapport |
| Décision structurante après autorisation | ADR Opportunity Engine déterministe/simulé, reprenant le cadrage accepté avant code |

Aucun fichier de cette dernière colonne n’est créé maintenant. Si la persistance, un endpoint/UI, des poids par tenant ou une nouvelle source de données deviennent nécessaires, arrêter l’implémentation concernée et demander validation d’un plan révisé.

## Frontières d’autorisation, RLS et confidentialité

Le moteur pur n’est **pas** une frontière d’autorisation : il ne reçoit ni session ni organizationId et ne lit aucune donnée tenant. Il ne possède aucune credential et ne contourne aucune vérification. Pas de nouvelle donnée tenantée en base ; donc aucune politique RLS nouvelle à prétendre démontrée sur une table inexistante.

Toute lecture/mutation CRM reste soumise à la frontière validée : session Better Auth vérifiée → validation → service/repository → même transaction withTenant → tony_app → PostgreSQL/RLS. OWNER lit/écrit dans son tenant ; MEMBER lit seulement ; PLATFORM_ADMIN exclu du CRM même via grant. Aucun nouveau droit MEMBER ou admin par le moteur. Aucune lecture via tony_auth/migrateur, GUC client ou identifiant d’URL comme autorisation.

Les tests de simulation ne doivent importer aucun repository Prisma, module d’authentification, provider ou fixture DB. Les scénarios ne proviennent pas de sessions/organisations réelles. Aucune donnée personnelle dans un texte d’explication, log ou artifact. Pas de cache global de résultats, stockage navigateur, payload RSC, prefetch, historique de scores ou export. Aucun event d’audit métier nouveau : le moteur en test n’effectue aucune opération métier ; l’audit CRUD SQL existant demeure intact.

La correction withTenant acceptée reste inchangée : fermeture avant commit réussi ; rollback Prisma sur erreur SQL sans close_context dans une transaction abortée. Sa régression réelle doit rester bloquante.

## Tests définis avant implémentation

Les nouveaux tests du moteur et fixtures seront écrits **après feu vert**, avant son implémentation. Cette section est une spécification documentaire, aucun test exécutable ajouté aujourd’hui.

| Couche | Cas et assertions prévus |
|---|---|
| Unitaire / validation négative | Champs inconnus dont organizationId/acteur/identifiant CRM, source autre que SIMULATED, clés manquantes, chaîne numérique, décimal, NaN/infini, <0/>100, version inconnue, données personnelles hors contrat : refus explicite ; null → INCOMPLETE sans score |
| Calcul exact | Toutes utilités 0 →0 ; toutes 100 →100 ; cas calculés à la main indépendamment de l’implémentation ; poids somment à 10000 ; contributions réconcilient le total ; bornes et arrondi exacts ; aucune mutation d’entrée |
| Sensibilité métier | Augmenter potentiel/urgence/fit/valeur améliore ou maintient le score ; augmenter effort/distance le réduit ou maintient ; variations d’une dimension isolée ; compromis fort potentiel/fort effort expliqué sans effet automatique |
| Seuils | Valeurs juste sous/au-dessus des seuils 25/45/65/80 ; priorité cohérente avec score exact, jamais avec un arrondi d’affichage |
| Versioning | Snapshot/version présents sur chaque sortie ; rejeu des fixtures 1.0.0 identique ; configuration retournée non mutante ; version inconnue/mélangée refusée ; modification du profil sans changement de version interdite par les fixtures de référence |
| Explications / i18n | Favorable/défavorable/intermédiaire aux frontières 30/70 ; aucun motif absent/inventé ; contribution exacte ; mêmes valeurs/rang en fr-FR/en-GB ; phrases ne prétendant ni kilomètres/euros ni disponibilité réelle |
| Classement simulé | ≥5 scénarios contrastés aux résultats attendus calculés manuellement ; ordre cohérent, égalités explicites, ordre d’entrée sans effet, IDs dupliqués/mélange versions/>100 refusés ; incomplets séparés sans fausse priorité |
| Isolation du moteur | Deux jeux synthétiques A/B évalués alternativement et en appels concurrents donnent chacun leur résultat isolé ; aucune accumulation de résultat ou état partagé ; A ne contient pas de marqueur B. **Ce test de pureté ne prouve pas la RLS**, vérifiée séparément sur PostgreSQL |
| SQL direct, régression bloquante | Conserver les 89 tests PostgreSQL du Lot 3 : A ne lit/modifie/supprime/insère pas B sur les quatre tables ; contexte absent/falsifié, droits MEMBER/admin/auth, FK composites, audit, session/membership révoqués, privilèges DDL et rollback withTenant. Aucun nouveau accès SQL scoring à tester dans cette proposition |
| HTTP réel, régression | Conserver les scénarios HTTP Lot 3 : B/objets/curseurs/parents étrangers, 401/403/404 uniformes, Origin, mass assignment, taille, no-store, concurrence versionnée et absence de retry automatique. **Aucun endpoint scoring n’est livré**, donc aucun succès HTTP de scoring fictif revendiqué |
| E2E desktop/mobile | Conserver 34 parcours et 6 répétitions focus, révocation/formulaires/historique/réponses retardées, DOM/HTML/RSC/réseau A/B et 320 px. Vérifier que les cinq écrans restent sans score/classement/explication synthétique injectés dans le CRM |
| Intégration technique | Import du moteur dans le runner Vitest sans DB, secret ou réseau ; aucune dépendance à l’application/Prisma/providers, aucune modification du contrat CRM/API ni lecture pendant build |

Scénarios canoniques à préparer : potentiel élevé/faible charge ; potentiel élevé/forte charge ; proche/urgent ; lointain/peu urgent ; bon fit/planning favorable ; égalité ; dimension inconnue ; valeurs aux bornes. Scores attendus issus de calculs indépendants, aucune assertion limitée à « retourne un nombre » ni snapshot mis à jour pour masquer un changement de formule.

## Risques sécurité, confidentialité, concurrence et exploitation

- **Confusion simulation/réalité** : aucun score de fixture dans le produit ou statistiques ; source SIMULATED obligatoire, aucune seed tenant. Le moteur V1 est validé techniquement, pas calibré commercialement sur clients réels.
- **Données manquantes et faux sentiment de précision** : score absent tant qu’incomplet ; indices manuels synthétiques et conversion non calibrée explicitement signalés. Pas de déduction de montant, distance ou historique inexistant.
- **Biais de pondération** : choix conservateurs mais à valider humainement ; ni règle client codée en dur ni caractéristique personnelle sensible. Aucun engagement commercial, message ou changement CRM automatique.
- **Régression d’isolation** : import accidentel d’un repository, état global ou exposition HTTP rendrait cette frontière fausse ; contrôles de séparation et gates SQL/HTTP/E2E obligatoires. Tout raccordement réel nécessite cadrage supplémentaire.
- **Concurrence/version** : fonctions réentrantes et entrées non mutées, profil immuable, pas de recalcul async ni écriture concurrente de scores. La concurrence optimiste CRM reste inchangée. Pas d’idempotence réseau ajoutée.
- **Historique** : fixtures immuables et snapshots en mémoire seulement ; aucune conservation durable métier. À résoudre avant scoring réel, sans réinterprétation silencieuse des anciennes versions.
- **Ressources/performance** : O(8) par score, classement borné à 100 scénarios ; aucun recalcul de masse en requête web ou job. Mesurer réellement les lots synthétiques, sans annoncer un P95 HTTP ou LCP à partir d’une mesure CPU.
- **Exploitation** : aucun nouveau secret/provider/service, aucun trafic payant, aucun déploiement production. Prérequis opérationnels existants restent incomplets ; les simulations ne les valident pas.
- **Dettes acceptées inchangées** : braces dev-only, réutilisation courte du grant admin ADR 0006 sans extension, Mac, email simulé, nettoyage contextes/grants, Vercel hors scope, performance synthétique, appareil physique/lecteur d’écran et préparation production. Limite ADR 0007 sur données déjà transmises conservée.

## Distinction avec les lots suivants

| Lot / sujet futur | Exclu du Lot 4 |
|---|---|
| 5 / Gate 1 | POC Twilio, numéro réel, téléphonie, webhook, SMS, audio |
| 6 / Gate 2 | Appel manqué → formulaire → opportunité, retry/jobs/idempotence fournisseur |
| 7–9 | Appels sortants, transcription, extraction IA, tâches/engagements automatiques |
| 10 / Gate 3 | Scoring raccordé au CRM et sources réelles, historique SQL tenanté, cinq vraies demandes scorées et explications issues de données autorisées |
| 11 | Appointment, calendrier, adresse, géocodage, distance/temps de trajet réels |
| 12–17 | Automatisations, onboarding, ROI, billing, parrainage, back-office |
| 18–22 | Support IA, i18n complète, hardening, bêta réelle et préproduction |

Le classement des cinq **fixtures simulées** ne constitue pas la Gate 3 du Lot 10. Aucun AIProvider/MapsProvider « en avance », préférence timezone, cinquième table CRM, nouveau rôle SQL, état Opportunity ou archivage parallèle.

## Ordre et gates après validation humaine

1. Consigner la décision validée dans une ADR dédiée ; définir fixtures et tests métier/négatifs indépendants avant moteur.
2. Contrat Zod, profil 1.0.0, normalisation/calcul, résultats/snapshots et explications ; aucune intégration tenant cachée.
3. Classement borné et traductions, documentation des exemples et limites ; revue de l’absence de nouvelles surfaces/permissions.
4. Exécuter lint/typecheck/unitaires/intégration/build, puis tous les HTTP/E2E desktop/mobile et répétitions focus existants ; ne réduire aucun test, conserver la régression withTenant. Les comptes exacts sont à relever, jamais à présumer.
5. Audit production, Docker/readiness **HTTP 200**, redémarrage/persistance/arrêt, CI complète, CodeQL et Dependency Review. Linux CI pour gates impossibles sur Mac, sans revendication d’exécution locale fictive. Migration fraîche/Lot 2 existante reste dans CI, mais aucune migration Lot 4.
6. Mesures CPU sur scénarios synthétiques (taille, nombre, environnement, distribution et durée déclarés), vérification non-régression visuelle des cinq écrans/320 px ; aucun SLA production déduit. Aucun nouvel écran de scoring à présenter comme accessible/testé.
7. `LOT_4_REVIEW.md` : décisions, fichiers, commandes réellement exécutées, cas/valeurs métier, SQL/HTTP/E2E et cross-tenant conservés, versioning, simulations, mesures, risques, dette, divergences et rollback. Arrêt pour revue humaine ; aucun Lot 5.

Commandes prévues, **non exécutées pour ce cadrage** : `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm build`, `pnpm test:e2e`, `pnpm exec playwright test tests/e2e/shell-ui.spec.ts --repeat-each=3 --output=test-results/focus-stability`, `pnpm audit --prod --audit-level=high`, `pnpm local:up`, contrôles Docker de CI et `pnpm local:down`.

Rollback envisagé : revenir au code Lot 3 ; aucun rollback SQL ou suppression de données puisque aucune migration/persistance nouvelle. Les fixtures/versions publiées dans Git restent traçables. Ne pas modifier la formule d’une version déjà validée à la place d’un rollback.

## Points soumis à validation et contrôle documentaire

Validation demandée sur : moteur pur sans endpoint/UI/persistance, huit échelles et inversions, poids et seuils proposés, traitement INCOMPLETE, explications déterministes, classement des simulations, versioning en code/snapshots/fixtures et historique durable reporté à l’intégration réelle. Ce plan ne constitue pas une approbation de ces propositions.

Seul `docs/LOT_4_PLAN.md` est créé. Brief/ADR/modèle/frontières existants inspectés ; aucune modification applicative, migration, dépendance, permission, workflow ou test. Aucun résultat Lot 4, benchmark ou CI nouvelle revendiqué pour cette préparation. Les fichiers de marque fournis par l’utilisateur sont reconnus pour de futures interfaces ; aucune intégration logo dans ce lot documentaire.

**ARRÊT : attendre validation humaine du cadrage et autorisation explicite avant toute implémentation du Lot 4.**
