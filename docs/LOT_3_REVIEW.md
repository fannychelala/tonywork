# Lot 3 — revue du CRM minimal

4 octobre 2026. Implémentation soumise à revue humaine ; aucune validation humaine du Lot 3 présumée. Branche `lot-3/minimal-crm`, [PR 14](https://github.com/fannychelala/tonywork/pull/14), base `lot-2/ui-shell` validée mais non fusionnée. Aucune fusion, donnée réelle ou mise en production. Arrêt après ce lot ; aucun Lot 4.

## Périmètre et décisions

[ADR 0008](adr/0008-crm-tenant-boundary.md) consignée avant le code métier, selon le [plan validé](LOT_3_PLAN.md). Fixtures et tests SQL/API négatifs écrits en priorité ; validation SQL réelle de la migration avant services, APIs et UI. Les assertions initiales ont révélé des erreurs de fixture/diagnostic et ont été corrigées sans contourner la frontière SQL.

Exactement quatre tables : Contact, ServiceTemplate, Opportunity, Task. PK `(organizationId,id)`, aucune unicité globale `id`, FK composites tenantées et RESTRICT ; téléphone E.164 unique dans son tenant seulement. UUID/tenant immuables, contraintes et index tenant-first. OWNER lit/écrit, MEMBER lit seulement, PLATFORM_ADMIN n’a aucun accès CRM même avec un grant administratif valide. Pas de cinquième table, rôle SQL, dépendance, SDK, provider externe ou scaffolding ultérieur.

Opportunity : NEW à la création, transitions manuelles, ARCHIVED seul archivage, restauration vers NEW. Aucun `deletedAt`/`archivedAt` ni automatisation sur WON. Suppressions physiques explicites, restrictives, confirmées. Task OPEN/DONE avec completedAt cohérent. Prix indicatifs en entiers mineurs, devises explicites EUR/GBP/USD/JPY/KWD ; saisie décimale convertie exactement, pas de conversion de devise, devis ou CA. Textes centralisés fr-FR/en-GB. Paramètres reste le shell Lot 2.

## Fichiers et migration

| Groupe | Ajouts / modifications |
|---|---|
| Décisions/documentation | `docs/adr/0008-crm-tenant-boundary.md`, `docs/LOT_3_PLAN.md`, ce rapport et `docs/review/lot-3/` ; statuts `AGENTS.md`, ADR 0007 ; `README.md`, `docs/DATA_MODEL.md`, `RLS.md`, `SECURITY.md`, `DESIGN_SYSTEM.md`, `INTERNATIONALIZATION.md`, `PERFORMANCE.md` |
| SQL/modèle | `prisma/migrations/20261004000300_crm_minimal/migration.sql`, `prisma/schema.prisma` |
| Validation/repositories/services | `src/modules/crm/validation.ts`, `dto.ts`, `errors.ts`, `repository.ts`, `service.ts`, `http.ts`, `money-input.ts` ; correction transactionnelle `src/server/security/tenant.ts` |
| APIs | `src/app/api/crm/[organizationId]/[kind]/route.ts`, `[kind]/[id]/route.ts` |
| UI | `src/modules/crm/panel.tsx`, `src/shared/i18n/crm.ts`, intégration `src/modules/shell/shell.tsx`, mode lazy optionnel `src/shared/ui/dialog.tsx`, styles CRM `src/app/globals.css` |
| Tests | `tests/integration/fixtures/crm.ts`, `crm-security.test.ts`, `crm-timezone.test.ts`, `crm-transaction.test.ts` ; `tests/unit/crm.test.ts` ; `tests/e2e/crm-security.spec.ts`, `crm-flow.spec.ts`, `crm-ui.spec.ts` |
| CI | `scripts/check-crm-upgrade.mjs`, étape additive dans `.github/workflows/ci.yml` |

Migration additive explicite **BEGIN/COMMIT** : quatre tables, contraintes, index, ENABLE/FORCE RLS, politiques, grants DML ciblés et trigger d’audit/immutabilité dans le même ensemble atomique. Aucune seed CRM/backfill. Aucun changement des rôles, droits par défaut, tables d’identité/session/grants ou préférence timezone. `package.json`, lockfile, initialisation des rôles et tests préexistants conservés.

Deux parcours migratoires réellement exécutés en CI : toutes les migrations sur base fraîche ; répétition Lot 2 → Lot 3 dans une base jetable, avec conservation d’une sonde synthétique existante et vérification des quatre tables FORCE RLS. La base jetable et sa sonde sont uniquement des outils de validation, sans nouvelle table applicative.

## Authentification, autorisation et RLS

Toutes les APIs CRM traversent : session Better Auth vérifiée → validation stricte → service/repository → **même transaction withTenant** → connexion `tony_app` → PostgreSQL/RLS. Les composants ne lisent pas la DB. L’URL organisation cible une demande, jamais une preuve. Aucun chemin CRM via `tony_auth`, migrateur ou grant admin implicite.

Les quatre tables ont ENABLE + FORCE RLS et le runtime n’en est pas propriétaire. SELECT exige un contexte privé valide, non administrateur, correspondant au tenant ; INSERT WITH CHECK, UPDATE USING + WITH CHECK et DELETE USING exigent en plus OWNER. Le contexte SQL existant revalide session et Membership. Un GUC falsifié n’autorise rien. `tony_auth` n’a aucun droit CRM ; le runtime n’a que SELECT/INSERT/UPDATE/DELETE ciblés, ni DDL ni TRUNCATE ni désactivation RLS. EXECUTE du trigger n’est pas accordé au runtime/PUBLIC.

Les fixtures utilisent les connexions privilégiées uniquement pour préparer identités/memberships et nettoyer leurs données synthétiques. Les opérations CRM et preuves d’isolation directes s’exécutent sous `tony_app`. Aucun rôle migrateur utilisé pour faire réussir une lecture/mutation métier runtime.

### Preuves directes A/B

`tests/integration/crm-security.test.ts` vérifie, **pour chacune des quatre tables** :

- OWNER A opère sur A ; SELECT B renvoie zéro ligne, UPDATE/DELETE B zéro effet, INSERT portant B échoue `42501`, snapshot de B inchangé.
- Sans contexte ou avec GUC falsifié : lecture vide, UPDATE/DELETE zéro effet, INSERT rejeté. MEMBER lit A mais aucune des trois mutations n’est autorisée.
- Grant PLATFORM_ADMIN existant : lecture vide et mutations refusées, sans extension des droits Lot 1.
- Identifiants immuables, y compris pour un utilisateur membre OWNER de A et B ; mêmes UUID possibles dans A/B ; téléphone identique autorisé dans A/B, doublon local `23505`.
- FK vers contact, prestation et opportunité présents seulement dans B refusées `23503` ; parent référencé non supprimable `23001` sous PostgreSQL 18. Bornes/status/completion invalides `23514`.
- Révocation/expiration de session et suppression de Membership retirent l’accès d’un contexte **déjà ouvert** à la requête suivante. Les 45 tests Lot 1 gardent également les contrôles de falsification, privilèges, sessions/MFA, changements de droits et audit admin.

Ces preuves SQL sont complémentaires des contrôles applicatifs ; aucune vérification `organizationId` seule ne remplace RLS.

## APIs et confidentialité

GET/POST collection, GET/PATCH/DELETE objet pour `contacts`, `services`, `opportunities`, `tasks` ; GET `today`. Entrées Zod strictes, DTO projetés, champs inconnus/tenant/acteur refusés, JSON ≤16 KiB, Origin configurée obligatoire sur mutations. SQL paramétré avec tables/colonnes autorisées explicitement. Pages 25/max50, recherche ≤120 caractères, curseur vérifié dans le tenant, aucun export massif.

401 sans session ; 404 uniforme objet/organisation inexistants ou étrangers ; 403 MEMBER dans son organisation ; 409 conflit local après autorisation. Aucun nom de contrainte, requête SQL, stack, session ou token dans la réponse. Succès et erreurs `private, no-store`, `Vary: Cookie`, aucune CORS permissive, cache partagé, stockage local ou prefetch tenant.

`crm-security.spec.ts` : comptes A/B réellement authentifiés ; accès à chaque collection B, à chaque objet B et curseur B refusé ; mutations/relations étrangères refusées ; origine absente/étrangère, mass assignment, corps trop grand et pagination excessive refusés. Marqueurs B des quatre entités et descriptions absents du DOM, HTML, RSC et réponses réseau chez A. Session plateforme valide refusée sur les cinq endpoints sans événement/grant admin implicite.

`crm-ui.spec.ts` : session révoquée pendant une édition retire formulaire et données privées ; retour historique ne les restaure pas. Une réponse autorisée réellement retardée puis relâchée après pagehide ne restaure pas le DOM ; une nouvelle navigation autorisée peut relire les données. Masque synchrone et annulation/revalidation du Lot 2 conservés. La disponibilité initiale du shell attend la consommation des réponses CRM initiales pour éviter une navigation interrompant leurs corps.

Limite ADR 0007 conservée : on ne peut effacer rétroactivement des octets déjà transmis pendant un accès autorisé ; une révocation distante ne retire pas instantanément un écran sans événement de revalidation. Aucune revendication plus forte.

## Audit et concurrence

Trigger SQL SECURITY DEFINER étroit, search_path fixé, vérification du contexte OWNER/tenant avant journalisation. CREATE/UPDATE/DELETE de chaque entité produit un événement avec acteur, organisation, UUID cible, corrélation et date, **sans PII métier** (nom, téléphone, email, description, prix). Audit append-only existant, interdictions UPDATE/DELETE conservées. Mutation et événement sont atomiques ; rollback annule les deux. Audit précommité des accès administrateur Lot 1 inchangé.

SQL direct teste les trois événements de chaque table et l’absence de marqueurs personnels. Après rollback, ni changement métier ni faux événement n’est conservé. Version attendue + incrément SQL atomique : seconde modification de même version ne change aucune ligne ; deux PATCH HTTP simultanés produisent exactement une réussite 200 et un conflit 409.

Double soumission UI : deux événements submit pendant une vraie requête retardée ne produisent qu’un POST ; bouton désactivé et verrou actifs, puis réactivation. **Aucune idempotence réseau persistante** : deux POST Opportunity identiques créent deux UUID distincts, doublon Contact seul bloqué par téléphone local. Test distinct de réponse perdue après commit : route.fetch reçoit le 201 réel puis coupe la réponse au navigateur ; message « résultat incertain », aucun renvoi automatique, relecture retrouve un seul contact et compteur de POST reste à un. Aucun retry automatique de création ni clé persistante.

## Aujourd’hui / timezone

Seule source : `Organization.timeZone` existant, lu dans withTenant autorisé. Pas de nouvelle préférence, hypothèse timezone client ou fallback. Instant serveur capturé une fois, date civile locale puis bornes UTC de deux débuts civils avec PostgreSQL. Intervalle [début,début suivant), jamais +24 h. Tâches OPEN en retard/du jour, null et DONE exclus ; opportunités NEW/TO_CONTACT sans échéance inventée. Groupes bornés à 25.

Quatre tests SQL : Paris DST 23 h/25 h, Paris/New York à même instant UTC donnent deux jours civils différents, timezone invalide échoue sans fallback. HTTP : inclusion au début, exclusion au début suivant, en retard, sans échéance, paramètres timezone client refusés, source New York effectivement lue. La saisie minimale d’échéance demande un instant UTC ISO explicite ; aucun calendrier anticipé.

## Commandes et résultats réellement exécutés

### Mac local

`pnpm lint`, `pnpm typecheck` (incluant `pnpm db:generate`), `pnpm test`, `pnpm build`, `pnpm audit --prod --audit-level=high` : réussis. 19/19 unitaires. `pnpm audit --json` : production propre, une alerte high `braces` dans l’outillage de développement. `git diff --check` : propre ; comparaison package/lockfile/initialisation SQL/tests historiques : aucune modification.

Inspection de `docker`, `psql` et runtimes : outils PostgreSQL/Docker et Chromium utilisable absents localement. **Aucune exécution locale de PostgreSQL, Docker ou E2E n’est revendiquée.** Ces gates sont effectuées réellement sous Linux CI. Aucun serveur/stack local laissé démarré par le Lot 3.

### Linux CI

Commandes réellement exécutées par le workflow :

```text
pnpm install --frozen-lockfile
psql <URL bootstrap locale CI> -v ON_ERROR_STOP=1 -f infra/postgres/init.sql
node scripts/check-crm-upgrade.mjs
pnpm db:migrate
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
pnpm exec playwright test tests/e2e/shell-ui.spec.ts --repeat-each=3 --output=test-results/focus-stability
pnpm audit --prod --audit-level=high
pnpm local:up
docker compose up -d --wait app worker
curl --fail http://localhost:3000/readiness
test "$(curl --fail --silent --show-error --output /dev/null --write-out '%{http_code}' http://localhost:3000/readiness)" = "200"
docker compose exec -T postgres psql ... -c "INSERT INTO system_probe (id) VALUES ('restart-validation');"
docker compose down
docker compose up -d --wait app worker
curl --fail http://localhost:3000/readiness
test "$(curl --fail --silent --show-error --output /dev/null --write-out '%{http_code}' http://localhost:3000/readiness)" = "200"
docker compose exec -T postgres psql ... -Atc "SELECT count(*) FROM system_probe WHERE id = 'restart-validation';"
docker compose exec -T postgres psql ... -c "DELETE FROM system_probe WHERE id = 'restart-validation';"
docker compose down
test -z "$(docker compose ps --status running -q)"
```

Les URL/secrets éphémères de validation ne sont pas recopiés. Redémarrage vérifie exactement une sonde persistée ; arrêt vérifie zéro conteneur actif. Les jobs CodeQL et Dependency Review exécutent les actions GitHub existantes ; aucun changement du workflow sécurité.

Résultats sur le commit applicatif `0d5ea7c` : [CI PR](https://github.com/fannychelala/tonywork/actions/runs/37217490967), [sécurité](https://github.com/fannychelala/tonywork/actions/runs/37217490982). Les checks sont également relancés par la publication finale de ce rapport et le renforcement de l’assertion HTTP 200 Docker (avant et après redémarrage) ; leur état courant est consultable sur la PR. Les commandes de statut HTTP explicite ci-dessous correspondent à cette validation finale.

| Gate | Résultat réel |
|---|---|
| Lint / typecheck / build | Réussis localement et en CI |
| Unitaires | **19/19** |
| PostgreSQL 18 réel | **89/89**, dont 45 tests historiques, 38 CRM sécurité, 4 timezone et 2 transaction/mesure |
| HTTP/API + E2E Chromium desktop/mobile | **34/34**, sans retry/flaky ; 17 par profil |
| Répétitions clavier/focus supplémentaires | **6/6**, sans retry |
| Base fraîche + upgrade Lot 2 | Réussis ; sonde conservée, quatre tables FORCE RLS |
| Docker/Compose/readiness | Stack migrée disponible, readiness 200 ; redémarrage, sonde conservée dans volume, arrêt propre vérifié |
| Audit production | Aucun avis de vulnérabilité connu |
| CodeQL / Dependency Review | Réussis ; analyse CodeQL PR `refs/pull/14/merge` sans erreur/avertissement ; alertes ouvertes sur cette référence : liste vide |
| Vercel | Aperçu en échec, dette connue hors périmètre ; aucun déploiement production |

Tous les tests préexistants conservés : 12 unitaires, 45 PostgreSQL, 14 E2E ; ajouts 7 unitaires, 44 PostgreSQL et 20 E2E. Les 8 scénarios HTTP utilisent un vrai serveur et PostgreSQL au sein des 34 E2E (pas un compteur de tests supplémentaire). Les 12 nouveaux scénarios UI complètent ces 8 scénarios et les 14 historiques. Aucun skip/test désactivé/assertion réduite ; répétitions de focus supplémentaires conservées.

## Accessibilité, mobile et revue visuelle

Parcours Chromium desktop et profil Pixel 7, plus viewport 320 px : création/édition/suppression confirmée, Entrée, Escape, focus initial/restauré, labels associés, erreurs annoncées, bouton verrouillé. MEMBER lit les quatre écrans sans bouton/formulaire d’écriture ; POST direct reste refusé. Les champs valides ne sont plus marqués invalides à cause d’une erreur sur un autre champ ; focus sur le premier invalide. Cibles et styles ≥44 px hérités des primitives Lot 2, clavier/drawer et répétitions de focus conservés. Titres maximaux sans espaces (120/160 caractères), listes Aujourd’hui et dialogues à 320 px : aucun overflow horizontal vérifié.

Revue visuelle manuelle des PNG produits par le vrai Chromium CI : Contacts/Prestations/Opportunités desktop, Aujourd’hui 320 px, formulaire opportunité mobile, formulaire prestation avec défilement interne, erreurs Contact, états vide/erreur du shell. Captures synthétiques issues de la CI `37217490967`, conservées sans retouche : [Contacts desktop](review/lot-3/desktop-contacts.png), [Prestations desktop](review/lot-3/desktop-services.png), [Opportunité archivée](review/lot-3/desktop-opportunities.png), [Aujourd’hui 320 px](review/lot-3/today-320.png), [formulaire Prestation](review/lot-3/desktop-service-form.png), [formulaire Opportunité mobile](review/lot-3/mobile-opportunity-form.png), [erreurs Contact](review/lot-3/mobile-contact-error.png), [état vide](review/lot-3/desktop-empty-contacts.png), [erreur d’accès](review/lot-3/mobile-access-error.png), [Paramètres 320 px](review/lot-3/settings-320.png). Espacement, texte, hiérarchie, focus visible, largeur et boutons examinés. Aucun nom/client réel.

Les interactions clavier/formulaires/confirmations sont exécutées par E2E ; inspection visuelle manuelle des captures effectuée ici. Une session authentifiée interactive sur le Mac, un appareil physique et une revue lecteur d’écran ne sont pas disponibles dans cet environnement ; aucune certification WCAG exhaustive revendiquée. Les dialogues longs défilent verticalement ; le backdrop des captures full-page couvre le viewport, ce n’est pas un débordement horizontal.

## Mesures de performance réellement effectuées

Sur l’exécution CI `37217490967`, PostgreSQL 18 et données synthétiques :

| Mesure | Taille / méthode | Résultat |
|---|---|---|
| Liste Contact SQL | EXPLAIN ANALYZE BUFFERS, rôle runtime autorisé, fixture d’une ligne, LIMIT 25 | Planning **0,082 ms**, exécution **0,129 ms**, 1 ligne |
| HTTP collection Contacts, profil desktop | 30 objets, 20 lectures séquentielles APIRequestContext, réponse entièrement consommée | P50 **9,859 ms**, P95 **10,804 ms**, max **14,795 ms** |
| Même mesure, projet mobile | Même serveur/jeu synthétique, 20 lectures ; ce n’est pas un réseau mobile | P50 **8,488 ms**, P95 **10,257 ms**, max **12,038 ms** |

Chargement lazy des éditeurs : aucun chargement des parents pour chaque formulaire fermé de chaque ligne. Lectures paginées, sélections DTO, Aujourd’hui borné ; pas d’ajout d’index spéculatif. La pagination réelle de 30 contacts donne 25 + 5 objets sans doublon. Recherche paramétrée littérale : tentative de chaîne SQL retourne zéro ligne.

Ces mesures synthétiques ne sont ni un test de charge, ni une mesure réseau mobile physique, ni le P95 serveur production. Aucune validation de LCP, charge multi-utilisateur ou SLA du brief sur cette seule base.

## Corrections réalisées

- Fixtures SQL : incrément version requis pour atteindre la contrainte FK/CHECK voulue ; diagnostic RESTRICT conforme à PostgreSQL 18 (`23001`) ; priorité du refus d’identifiant immuable explicite. Assertions de refus maintenues.
- `withTenant` : le finally fermait le contexte après une erreur SQL et masquait sa cause par `25P02`. Fermeture sur succès seulement, rollback Prisma atomique sur échec ; régression réelle démontre erreur `23505` originale et absence de contexte résiduel.
- Erreurs adapter Prisma : SQLSTATE imbriqué normalisé par parcours borné de métadonnées connues ; 404/409 génériques attendus restaurés sans publier les messages SQL.
- Sélecteurs parent : sélection contrôlée conservée lors du chargement/rechargement des options, corrige l’édition/archivage bloquée. Assertion renforcée sur statut réellement visible après fermeture du dialogue.
- Aujourd’hui rechargé après mutation de tâche ; chargement lazy des dialogues évite lectures inutiles ; aucune modification du comportement des primitives non lazy.
- Saisie prix décimaux convertie en unités mineures sans flottant ; texte long correctement replié à 320 px.
- Navigation initiale : une ancienne assertion réseau du shell pouvait attendre le corps d’une requête CRM interrompue par navigation. Readiness du shell coordonnée avec les réponses initiales consommées ; ancien test inchangé. Typage du callback optionnel corrigé avant relance complète.
- Accessibilité : erreurs rattachées aux seuls champs invalides et focus ciblé ; preuve ajoutée pour téléphone invalide avec nom/email valides.

Les exécutions intermédiaires échouées/flaky ne sont pas présentées comme des gates finales satisfaites ; seules les exécutions finales ci-dessus servent de preuve.

## Risques, dette et divergences

Aucune extension fonctionnelle ou nouvelle dépendance par rapport au plan autorisé. Ajustements techniques documentés : traitement d’erreurs transactionnelles partagé et synchronisation du shell nécessaires pour les nouveaux flux ; aucune relaxation SQL. Les contraintes runtime/migration restent séparées.

Dettes conservées : [braces dev-only](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), réutilisation courte du grant admin ADR 0006 (possession simultanée runtime + session admin valide), contraintes Mac, email local simulé, nettoyage global contextes/grants et préparation opérationnelle. Durée/droits admin non étendus ; les quatre tables CRM sont exclues. Aperçu Vercel en échec, hors gates autorisées, non traité et sans impact sur ces tests Linux.

Avant usage réel : provider email et exploitation validés, sauvegarde/restauration, rétention/anonymisation et gestion opérationnelle à finaliser. Téléphone partagé/fusion/import/export hors scope ; résultats POST incertains peuvent dupliquer des objets sans unicité métier ; relecture/confirmation nécessaire. API bornée sans dispositif anti-abus externe CRM supplémentaire. Mesures performance sur petits jeux synthétiques seulement. Limite de révocation ADR 0007 et revue physique/lecteur d’écran restent explicites.

## Rollback et arrêt

Revenir au code Lot 2 ; conserver les tables/migration additives sans utilisation. Ne pas supprimer les données ni retirer les quatre tables à chaud. Cette version ne peut pas être déployée en production avant les prérequis opérationnels ; aucun rollback production exécuté. Migration depuis Lot 2 et base fraîche validée, restauration complète à répéter dans l’environnement opérationnel avant usage réel. En cas de correctif, migration corrective explicite, jamais modification rétroactive d’une migration déjà appliquée.

**Lot 3 prêt pour revue humaine. Aucun Lot 4, fusion de PR, production ou élargissement sans nouvelle autorisation explicite.**
