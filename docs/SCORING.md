# Opportunity Engine 1.0.0 — simulations uniquement

Calibration technique validée pour la V1 ; **aucune validation commerciale empirique**. Aucun raccordement CRM, table, migration, seed, endpoint, UI, job, provider ou nouvelle dépendance. Le moteur ne reçoit ni identité ni tenant et ne constitue aucune preuve d’autorisation/RLS. Voir ADR 0009 et LOT_4_PLAN.md.

## Contrat et calcul

`score(unknown)` valide avec Zod : source SIMULATED, scenarioId `sim-` + 1–60 caractères ASCII minuscules/chiffres/tirets (premier caractère alphanumérique), scoreVersion exactement 1.0.0 et huit entiers 0–100 ou null. Champs inconnus refusés à chaque niveau ; aucune coercition, latest, identité, texte libre ou identifiant CRM.

Ordre : economicPotential, effort, distance, urgency, conversionProbability, strategicFit, scheduleFit, customerValue. Poids : 2500/1500/1000/1500/1000/1000/1000/500 points de base, somme 10000. Utilité = valeur, sauf effort/distance =100−valeur. ContributionNumerator = poids×utilité. N=somme des huit contributions. ScoreBasisPoints = floor((N+50)/100), arrondi agrégé entier demi-vers-le-haut, borné 0–10000 ; présentation score/100.

Avec V1, tous les poids sont multiples de 100 et N/100 est entier : pas d’arrondi effectif des résultats V1. Le helper d’arrondi est néanmoins testé exactement sous/à la demi-valeur, sans ajouter un second profil fictif. Priorité sur scoreBasisPoints, pas score arrondi d’affichage : ≥8000 VERY_HIGH, ≥6500 HIGH, ≥4500 NORMAL, ≥2500 WAIT, sinon LOW.

Null → INCOMPLETE, score/priorité null et dimensions manquantes ordonnées. Aucun 0/50 inventé ni renormalisation. Les contributions connues restent visibles dans le snapshot mais ne forment pas un score partiel. Résultats/snapshots, profil et dictionnaires gelés récursivement. Aucune mutation d’entrée ni cache partagé.

## Références historiques calculées indépendamment

Valeurs d’entrée dans l’ordre des huit dimensions ci-dessus. Les noms sont des IDs synthétiques sans identité/client. Contributions numériques manuscrites conservées dans tests/unit/fixtures/scoring-v1.ts ; ne jamais les régénérer depuis le moteur pour masquer une divergence.

| Scénario | Valeurs | N | ScoreBasisPoints / score | Priorité |
|---|---|---:|---|---|
| sim-high | 90/20/10/80/70/90/80/60 | 825000 | 8250 / 82,50 | VERY_HIGH |
| sim-costly | 90/90/80/40/50/60/30/20 | 470000 | 4700 / 47,00 | NORMAL |
| sim-urgent | 60/40/5/100/60/60/70/40 | 695000 | 6950 / 69,50 | HIGH |
| sim-distant | 30/80/90/10/20/30/20/10 | 205000 | 2050 / 20,50 | LOW |
| sim-fit | 65/30/30/50/65/95/95/70 | 702500 | 7025 / 70,25 | HIGH |

Détail sim-high : 225000 +120000 +90000 +120000 +70000 +90000 +80000 +30000 =825000. Effort20 donne utilité80 et contribution120000 ; distance10 donne utilité90 et contribution90000. Total/100=8250, soit82,50 et VERY_HIGH. Ce n’est ni un montant ni une probabilité de conversion.

Classement attendu : high, fit, urgent, costly, distant. Un duplicata de valeurs avec un autre ID est une égalité réelle : même rang, ordre technique ASCII par ID, rang suivant de compétition (1,1,3). IDs dupliqués/version inconnue ou mélangée/>100 scénarios refusés. Les incomplets sont séparés, uniquement triés techniquement par ID, sans rang commercial.

## Explication et versions

`explain(result,locale)` reçoit uniquement un résultat du moteur et fr-FR/en-GB. Huit lignes explicitent indice, inversion éventuelle, utilité et contribution/100. UNKNOWN est explicitement inconnu. Utilité≥70 favorable, ≤30 défavorable, sinon intermédiaire. Au plus deux facteurs par catégorie, poids décroissant puis ordre des dimensions ; aucun facteur inventé si absent. L’avertissement de simulation/calibration non commerciale accompagne chaque explication. Aucun kilomètre, euro, disponibilité réelle, LLM ou fait personnel.

Profil 1.0.0 fermé et immuable : aucune résolution latest. Chaque sortie inclut version, calibration et snapshot permettant le rejeu. Toute évolution affectant résultat/formule/explication nécessite une nouvelle version ; ne pas réinterpréter les références historiques. Seule persistance : fixtures synthétiques Git ; aucun historique durable métier livré. Intégration réelle et tables OpportunityScore/OpportunityScoreVersion reportées au Lot 10 avec nouveau cadrage RLS.

## Vérification et limites

Tests indépendants : validation stricte, calculs manuels/snapshots exacts, bornes/arrondis/seuils, monotonie des huit dimensions sur 0–100, immutabilité, null, classement/égalités, locale, absence d’état partagé et imports autorisés. Tests PostgreSQL/HTTP/E2E du Lot 3 restent les preuves de sécurité tenant ; aucun test de pureté n’est présenté comme un test RLS.

Mesures CPU synthétiques dans LOT_4_REVIEW.md : warmup1000, 20 échantillons de1000 calculs et 20 lots de10 classements de100 scénarios, checksum indépendant. Aucun P95 HTTP/LCP/charge production ni preuve de pertinence commerciale déduit d’un benchmark CPU. Simulation sans donnée réelle, exploitation et dettes acceptées inchangées. Rollback : code Lot 3, aucun rollback SQL.
