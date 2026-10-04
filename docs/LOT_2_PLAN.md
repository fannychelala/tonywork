# Préparation du Lot 2 — design system et shell applicatif

Statut : cadrage avant implémentation. Lot 1 validé par l’utilisateur. Aucun code applicatif, test, schéma ou migration changé lors de cette préparation. Sources relues : brief complet (notamment §7–9, 14–20, 73–79, 101–118, 126–127), AGENTS.md, ADR 0001–0006, documentation design/i18n et modèle existant.

## Périmètre exact
Le §126 demande navigation mobile et desktop, layout/header, cards/buttons/forms/modals/drawers, typography, skeletons, états de chargement/erreur/vide et principaux écrans sans logique complète.

Écrans prévus : Aujourd’hui, Opportunités, Contacts, Prestations, Paramètres. Les intitulés anticipent les écrans du §127 mais seulement leur structure et des états vides explicites. Aucune entité Contact, Opportunity, ServiceTemplate ou Task, aucune recherche/édition/enregistrement CRM, aucun scoring, téléphonie, onboarding métier, facturation, back-office ou fournisseur externe. Ne pas afficher des chiffres inventés comme de vraies statistiques. Les actions non disponibles seront expliquées ; pas de boutons prétendant enregistrer des données absentes.

Composants partagés dans src/shared/ui, tokens existants conservés : boutons/liens, champs et erreurs associés, cartes si utiles, alertes, dialogues, panneaux, skeletons et états vides. Mobile d’abord, cibles tactiles >=44px, navigation clavier, focus visible/restauré, dialogue avec fermeture Escape et gestion du focus. Présentation chaleureuse et sobre ; accueil centré sur la prochaine action, pas un dashboard analytique.

## Tables, migrations et dépendances
Aucune nouvelle table, colonne, politique RLS, permission ou migration requise pour ce périmètre. Réutiliser User/Session et Organization/Membership du Lot 1 seulement si le shell affiche une identité ou organisation autorisée. Aucun stockage d’un tenant actif ou de préférences en DB dans ce lot.

Aucune dépendance nouvelle prévue : Next/React, CSS/tokens, dictionnaires typés fr-FR/en-GB, Zod, Vitest et Playwright existants. Pas de SDK/provider, analytics, ressource distante, service payant ou nouvelle plateforme. Les primitives HTML natives sont privilégiées pour les composants accessibles. Si une bibliothèque devient indispensable, justifier le besoin, vérifier compatibilité et audit avant ajout ; ne pas installer préventivement. Pas de changement des overrides ni de traitement Vercel.

Ne pas ajouter un routage multilingue ou une préférence persistante uniquement pour ce shell. Textes centralisés et test des deux dictionnaires ; formatage Intl reçoit explicitement locale/devise/timezone. La langue du shell ne modifie pas celle de l’organisation. ADR supplémentaire uniquement si une décision structurante devient nécessaire.

## Flux et frontière d’autorisation
1. Requête d’écran privé → session Better Auth vérifiée côté serveur. Sans session, écran d’accès requis sans donnée tenant. La création d’un nouveau système d’authentification est exclue.
2. L’identifiant d’organisation de la route est uniquement une cible demandée, validée UUID. Il ne vaut jamais autorisation et ne provient pas d’un champ caché réputé fiable.
3. Lecture organisation → service existant readOrganization/withTenant → open_context → vérification PostgreSQL de session/Membership → RLS forcée. Retour au rendu d’un DTO minimal, sans token, mail privé, session interne ni contenu audit inutile.
4. Navigation entre les écrans conserve la cible mais chaque lecture serveur refait l’autorisation. Aucun accès Prisma tenant depuis le composant, aucun bypass par le compte auth, aucune fonction pour énumérer toutes les organisations.
5. Écrans métier vides : contenu de présentation commun, sans fausse donnée client ni requête vers des tables futures. Les composants de formulaire démontrent validation/erreurs sans écriture métier hors périmètre.
6. PLATFORM_ADMIN : aucune consultation tenant implicite via navigation. Le shell ordinaire n’obtient aucun grant ; pas de back-office Lot 17. Si un futur flux admin consulte un tenant, il devra conserver strictement le modèle Lot 1 MFA/raison/audit préalable/lecture seule.

Toute donnée tenant ajoutée ultérieurement imposerait une réévaluation du périmètre, organizationId, ENABLE/FORCE RLS, droits minimaux et tests directs avant exposition. Il n’y a donc aucune nouvelle donnée tenant persistée à laisser hors frontière dans le Lot 2 préparé.

## Risques à couvrir
Fuite de nom/adhésion via layout, HTML, payload React Server Components ou prefetch ; cache partagé entre sessions/organisations ; organisation choisie côté navigateur considérée autorisée ; affichage restant après déconnexion/révocation ; redirection externe injectée ; token/session dans le DOM ou état client ; contenu non échappé ; dialogue inaccessible, focus perdu et navigation mobile masquée.

Rendu privé dépendant de la requête/session, sans cache global ni stockage client de données sensibles. Préserver les 404 homogènes pour org étrangère/inexistante. Aucun paramètre de retour externe non validé. React rend les textes échappés ; pas de HTML injecté. Recontrôler l’autorisation après changement de session et ne pas restaurer de données privées via un cache de navigation.

Dette sécurité admin explicitement conservée dans ADR 0006 et AGENTS.md : grant réutilisable une minute si runtime SQL et session admin valide sont simultanément détenus. Ne pas étendre durée, portée, droits ou assouplir session/MFA/justification/audit. Autres limites acceptées : email local, nettoyage des contextes/grants, préparation opérationnelle, braces, contraintes Mac et Vercel exclu. Aucun usage réel ni mise en production.

## Tests prévus avant implémentation
| Niveau | Cas et résultat attendu |
| --- | --- |
| PostgreSQL | Conserver intégralement les 45 tests Lot 1, dont accès direct tony_app, GUC falsifié, sessions invalides/révoquées, moindre privilège, audit et rollback admin. Aucun mock de RLS. |
| Intégration shell | Lecture serveur de l’organisation autorisée réussit ; aucune lecture ne passe par tony_auth ni un organizationId seul ; pas de mutation depuis les composants. |
| E2E desktop + mobile | Session A : écran et nom de A ; URL B et UUID inexistant : même refus, aucun nom/membership B dans DOM/HTML/payload réseau/prefetch. Vérifier chacune des routes privées. |
| E2E négatifs | Absence de session, session expirée/révoquée, utilisateur non membre : aucune donnée privée ; UUID invalide refusé. Déconnexion puis historique/navigation ne restaurent pas le tenant. |
| E2E rôles | OWNER et MEMBER restent limités à leur organisation ; aucune écriture CRM/permission depuis les écrans ; PLATFORM_ADMIN sans consultation autorisée ne reçoit aucun tenant ni grant implicite. |
| E2E composants | Navigation active, menu mobile, formulaire de présentation et erreurs, modal/drawer ouverts/fermés au clavier, Escape, focus initial/restauré, chargement/erreur/vide explicites. |
| I18n / UX | Clés fr-FR/en-GB cohérentes, aucun texte UI dispersé ; formats non couplés ; petits écrans sans débordement, labels et cibles tactiles. Validation visuelle desktop/mobile en plus des assertions. |

Préparer les fixtures synthétiques A/B et les assertions négatives avant les composants qui lisent le tenant. État anti-abus isolé par scénario comme Lot 1 ; ne pas diminuer les limites ni contourner de test pour la présentation. Les captures et traces ne contiennent que données synthétiques.

## Ordre et gates de livraison
1. Arrêter les choix de navigation et de rendu privé à partir de ce cadrage ; préparer les tests/fixtures de sécurité.
2. Construire les primitives puis le shell et les écrans bornés ; réutiliser les services Lot 1.
3. Valider clavier, mobile, états et dictionnaires ; corriger les causes des échecs.
4. Exécuter pnpm lint, pnpm typecheck, pnpm test, pnpm test:integration, pnpm build, pnpm test:e2e, pnpm audit --prod --audit-level=high ; Docker readiness/redémarrage/persistance/arrêt ; CI GitHub, CodeQL et Dependency Review. Compte tenu des contraintes Mac, utiliser Linux CI pour PostgreSQL/Docker/Chromium sans revendiquer des validations locales non exécutées.
5. Rapport Lot 2 avec fichiers, commandes réellement exécutées, migrations (aucune attendue), décisions, résultats CI, preuves cross-tenant, validation visuelle/manuelle, risques, dette, divergences et rollback. Aucun test exécuté pour le Lot 2 à ce stade documentaire.
6. Arrêt pour revue humaine après Lot 2. Aucun Lot 3 sans autorisation explicite.
