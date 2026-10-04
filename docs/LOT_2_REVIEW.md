# Revue Lot 2 — Tony

Date : 4 octobre 2026. PR [#13](https://github.com/fannychelala/tonywork/pull/13), branche lot-2/ui-shell, base lot-1/auth-tenant-rls validée. Périmètre strict : design system et shell. Aucun Lot 3, aucune fusion ni production.

## Résultat des gates
Validation du code `8908994` : [CI PR](https://github.com/fannychelala/tonywork/actions/runs/37208335121), [sécurité](https://github.com/fannychelala/tonywork/actions/runs/37208335102). Toutes les gates réussies, sans retry ni test flaky dans ce run. Les commits de documentation suivants ne changent pas le code ; leurs checks sont visibles sur la PR.

| Contrôle | Résultat |
|---|---|
| lint / typecheck / build | PASS local et Linux CI |
| Tests unitaires | 12/12 |
| PostgreSQL réel, dont isolation et privilèges Lot 1 | 45/45 |
| E2E Chromium desktop/mobile | 14/14 |
| Stabilité focus : 3 répétitions par profil | 6/6 supplémentaires |
| Audit production | PASS, aucune vulnérabilité production signalée |
| Docker/Compose, migrations, readiness | PASS, HTTP 200 |
| Redémarrage, volume PostgreSQL, arrêt propre | PASS |
| CodeQL / Dependency Review | PASS |
| Revue visuelle et interaction clavier locale | Réalisées, limites ci-dessous |

Les contrôles PostgreSQL/Chromium/Docker complets ont réellement tourné sur Linux GitHub Actions. Les contraintes Mac restent documentées. L’aperçu Vercel reste hors périmètre et ne sert pas de gate Lot 2.

## Livré et fichiers
- Cinq écrans structurels /app/<organizationId>/{today,opportunities,contacts,services,settings}, navigation desktop et drawer mobile, header, layout, états loading/error/empty ; aucun CRM ni statistique/action simulant une écriture réelle.
- src/app/app/[organizationId]/[screen]/page.tsx ; src/modules/shell/{shell,demo-form}.tsx et screens.ts.
- Primitives : src/shared/ui/{primitives,dialog}.tsx ; CSS scoped ajouté à src/app/globals.css, tokens initiaux conservés. Button, Card, Alert, Field, Skeleton, EmptyState, Dialog et Drawer.
- Textes : src/shared/i18n/shell.ts (fr-FR/en-GB, marque issue du dictionnaire existant).
- Frontière : src/app/api/shell/[organizationId]/route.ts et méthode readOrganizationIdentity dans src/modules/organizations/service.ts.
- Tests écrits en premier : tests/e2e/fixtures/shell.ts et shell-security.spec.ts. Ajouts : shell-ui.spec.ts, tests/unit/shell.test.ts.
- CI : .github/workflows/ci.yml conserve toutes les gates, ajoute répétition ciblée du parcours UI (trois fois par profil), artifacts de captures aussi en cas de succès.
- Documentation : AGENTS.md, README.md, docs/{LOT_2_PLAN,LOT_2_REVIEW,DESIGN_SYSTEM,INTERNATIONALIZATION,SECURITY}.md ; ADR 0006 (validation/dette explicite) et nouvelle ADR 0007 ; captures de revue docs/review/lot-2/.

Aucune nouvelle table, colonne, migration, permission SQL ou dépendance. prisma/schema.prisma, prisma/migrations, infra/postgres, package.json et pnpm-lock.yaml inchangés par rapport au Lot 1. Les 45 tests PostgreSQL existants restent inchangés.

## Décisions et sécurité
ADR 0007 : HTML et RSC initial génériques, sans nom/membership/session/token tenant. L’identifiant d’URL n’est qu’une cible demandée. Une API reçoit la session validée Better Auth, vérifie l’UUID, refuse PLATFORM_ADMIN dans le shell ordinaire, puis appelle le service sous withTenant/open_context/RLS. Seuls id/name sortent vers le navigateur autorisé ; aucune donnée identité privée ni audit.

Aucun accès Prisma depuis les composants, aucun accès tenant sous tony_auth, aucune permission ou fonction SQL élargie. Pas de grant administrateur implicite. La dette de grant réutilisable une minute sous possession simultanée du compte runtime et d’une session admin valide est explicitement conservée, sans extension de durée/portée/droits, et sans assouplissement de MFA/justification/audit précommité.

Les liens tenant effectuent une navigation complète sans prefetch Next ni cache du routeur client. API private/no-store et Vary Cookie ; fetch no-store ; aucun stockage navigateur du tenant. Avant pagehide ou déconnexion, masque et retrait immédiat du DOM privé via flushSync ; pageshow, focus et retour de visibilité revalident. DTO vidé en cours de vérification. Aucune création d’interface compte/onboarding ou préférence persistante hors périmètre.

## Preuves de non-fuite
Les fixtures créent deux utilisateurs/organisations A/B synthétiques par les vraies API auth/tenant. Appels privilégiés d’identité/migration limités au setup de sessions expirées/révoquées et rôles de fixtures ; toutes les lectures applicatives utilisent tony_app et les politiques réelles.

Pour chacune des cinq routes : A voit uniquement son nom ; B renvoie l’état indisponible sans nom ; HTML et RSC ne contiennent pas le marqueur secret B ; collecte des réponses navigateur (HTML/JSON/JS) exige son absence. L’API B et un UUID inexistant renvoient le même 404 et le même corps. Le DTO autorisé contient exactement id/name et l’en-tête no-store.

Sans session, avec UUID invalide, session expirée ou révoquée : aucun nom dans le DOM. MEMBER lit seulement l’organisation dont il est membre. Fixture PLATFORM_ADMIN avec session valide et membership existante : shell refusé, aucun nouvel audit PLATFORM_TENANT_ACCESS, donc aucun grant implicite.

Assertion immédiate après pagehide : l’élément portant le nom d’organisation n’existe plus. Après déconnexion et retour historique : état connexion requise et aucun nom dans le DOM. Les tests directs SQL du Lot 1 prouvent toujours SELECT/UPDATE/DELETE cross-tenant interdits, GUC falsifié sans effet, contexte/session invalides, DDL/SET ROLE interdits et audit admin conservé après rollback.

## Accessibilité, mobile et validation visuelle
Modal natif avec fond inerte et Escape. Déclencheur focalisé avant showModal, focus initial sur Fermer, confinement explicite Tab/Shift+Tab, restitution native du focus sans callback différé susceptible de voler un focus ultérieur. Assertions sur un dialogue à un seul contrôle et sur le drawer ; parcours UI répété trois fois pour chacun des deux profils Chromium.

Field associe label, aria-invalid et aria-describedby à l’erreur ; erreur annoncée par role=alert, résultat de démonstration par role=status. Le formulaire indique explicitement qu’aucune valeur n’est envoyée/enregistrée. Skeleton role=status ; accès/erreur/vide explicitement libellés. Lien d’évitement Lot 0 conservé.

Cibles >=44px via CSS ; hauteurs réelles des liens/boutons drawer vérifiées. Vérification document.scrollWidth <= innerWidth sur les cinq écrans et à 320px. Captures inspectées manuellement : cinq écrans desktop/mobile, drawer 320px, paramètres 320px, loading/error, modal et formulaire invalide/valide. Textes lisibles, navigation active visible, focus bleu net, aucune statistique inventée ni débordement constaté. Les captures full-page d’un modal montrent le backdrop du viewport ; cela n’est pas un rendu de page entière derrière le modal.

Contrastes des principales paires de tokens calculés localement : texte/fond 11,11:1 ; secondaire/fond 6,07:1 ; bouton principal/blanc 8,15:1 ; focus/blanc 6,25:1 ; erreur/blanc 7,09:1 ; navigation active 9,89:1. Vérification bornée, sans prétendre à une certification WCAG complète ni à une revue avec lecteur d’écran.

Contrôle interactif supplémentaire dans le navigateur intégré Mac, sans session ni DB locale : état connexion requise, ouverture du drawer, focus initial Fermer, Shift+Tab vers Paramètres, Escape et observation du focus revenu au menu. Aucun tenant affiché. Le serveur temporaire a été arrêté ; aucune donnée réelle introduite. Les tests Chromium/DB/Docker complets sont Linux CI, pas revendiqués exécutés sur Mac.

Captures de revue : [Aujourd’hui desktop](review/lot-2/today-desktop.png), [Paramètres mobile](review/lot-2/settings-mobile.png), [drawer 320px](review/lot-2/drawer-320.png), [chargement](review/lot-2/loading.png), [erreur](review/lot-2/error.png), [modal](review/lot-2/modal.png), [formulaire invalide](review/lot-2/form-invalid.png). Toutes les données visibles sont synthétiques.

## Commandes réellement exécutées
Local : pnpm lint ; pnpm typecheck ; pnpm test ; pnpm build ; pnpm audit --prod --audit-level=high ; pnpm start (preview à configuration temporaire valide, puis SIGINT) ; script local de calcul des contrastes ; git add/commit/push ; gh pr create/edit, gh run list/view/download et gh api pour contrôler les jobs/logs et récupérer leurs captures.

Linux CI : pnpm install --frozen-lockfile ; psql -v ON_ERROR_STOP=1 -f infra/postgres/init.sql ; pnpm db:migrate ; pnpm lint ; pnpm typecheck ; pnpm test ; pnpm test:integration ; pnpm build ; pnpm exec playwright install --with-deps chromium ; pnpm test:e2e ; pnpm exec playwright test tests/e2e/shell-ui.spec.ts --repeat-each=3 --output=test-results/focus-stability ; pnpm audit --prod --audit-level=high.

Docker CI : pnpm local:up ; docker compose up -d --wait app worker ; curl --fail http://localhost:3000/readiness ; INSERT/SELECT/DELETE d’un marqueur synthétique system_probe via docker compose exec -T postgres psql ; docker compose down ; docker compose up -d --wait app worker ; readiness et conservation du marqueur vérifiées ; docker compose down ; vérification docker compose ps --status running -q vide. Volume non supprimé. CI CodeQL et Dependency Review exécutées sur la PR.

## Corrections effectuées
Confinement du focus Tab dans un modal à un seul contrôle ; suppression du callback close différé qui pouvait voler le focus du drawer après fermeture du formulaire ; drainage des réponses HTTP de refus pour ne pas laisser de flux en attente lors de navigation ; pools fixtures propres à chaque fichier, fermés une seule fois ; budget explicite du scénario A/B complet. Actions d’erreur espacées après inspection à 320px. Aucune assertion relâchée, aucun test supprimé/ignoré, aucun audit désactivé, aucune RLS contournée, aucune dépendance downgrade/override supplémentaire.

## Risques, dettes, performance, i18n et divergences
Le navigateur peut déjà posséder une réponse obtenue pendant une session autorisée ; une révocation externe ne peut effacer rétroactivement ces octets. Un écran laissé ouvert reste visible jusqu’au prochain événement de revalidation (focus/visibilité/navigation/rechargement). Chaque nouvelle lecture passe par PostgreSQL ; restauration historique et déconnexion retirent le DOM avant exposition. Pas de promesse de révocation visuelle instantanée à distance ni de protection contre le propriétaire d’un navigateur ayant reçu une donnée autorisée.

Navigation complète choisie pour éviter un cache client tenant implicite ; moins instantanée qu’une transition Next, assumée pour ce shell limité. DTO minuscule, pas de liste métier, N+1 ou cache global ajouté. Français par défaut, clés en-GB vérifiées ; aucune sélection de langue ni préférence persistante introduite, aucun couplage avec langue/devise/timezone de l’organisation.

Restent les dettes acceptées Lot 1 : email simulé local, préparation opérationnelle avant production, nettoyage global des contextes/grants abandonnés, braces dev-only sans correctif compatible, contraintes Mac et Vercel exclu. Grant admin inchangé. Pas de vrais utilisateurs/clients, pas de production, pas de fournisseurs payants. Pas de logique CRM ni de parcours auth supplémentaire. Validation visuelle sur captures et interaction locale générique ; pas de test physique sur téléphone ni lecteur d’écran.

Aucune divergence du périmètre validé ; la nouvelle API est uniquement l’adaptation de lecture minimale nécessaire au shell. Aucune extension de table/dépendance n’a été requise. Rollback : arrêter/revenir au commit Lot 1, sans migration à annuler ni donnée à supprimer ; volume conservé. PR laissée ouverte pour revue humaine. ARRÊT après Lot 2 ; aucun Lot 3 sans autorisation explicite.
