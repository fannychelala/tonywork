# Revue Lot 1 — Tony

Date : 4 octobre 2026. Lot 0 validé ; Lot 1 uniquement. PR #12 sur lot-1/auth-tenant-rls, base validation/lot-0-environment (compléments Lot 0 déjà validés mais non fusionnés). Aucune fusion, aucun Lot 2, aucune donnée réelle. Vercel exclu.

## Résultat et gates
Version fonctionnelle contrôlée : ba1113c. [CI complète](https://github.com/fannychelala/tonywork/actions/runs/37190144494) et [sécurité](https://github.com/fannychelala/tonywork/actions/runs/37190144617) réussies. Le commit documentaire du présent rapport est également soumis aux mêmes workflows ; leurs résultats sont visibles dans la PR.

| Contrôle | Résultat réel |
| --- | --- |
| lint / typecheck / build | Réussis en local et Linux CI |
| Tests unitaires | 10/10 en local et CI |
| PostgreSQL réels | 45/45 : 3 fondation, 38 sécurité/isolation, 4 Better Auth |
| E2E Chromium | 6/6 : 3 desktop + 3 mobile |
| Docker/Compose | Démarrage, migration, readiness HTTP 200, redémarrage avec volume et arrêt propre réussis sur Linux CI |
| Audit production | Aucun avis connu, local et CI |
| CodeQL / Dependency Review | Réussis sur la PR |
| Docker/PostgreSQL/Chromium Mac | Restrictions environnementales Lot 0 conservées ; aucune réussite locale de ces gates revendiquée |
| Vercel | Aperçu historique non traité, hors périmètre |

Commandes effectivement exécutées localement : pnpm lint, pnpm typecheck, pnpm test, pnpm build, pnpm audit --prod --audit-level=high ; git add/commit/push et gh run list/view/api pour publier et inspecter la CI.

Commandes effectivement exécutées sur Linux CI : pnpm install --frozen-lockfile ; psql -v ON_ERROR_STOP=1 -f infra/postgres/init.sql ; pnpm db:migrate ; pnpm lint ; pnpm typecheck ; pnpm test ; pnpm test:integration ; pnpm build ; pnpm exec playwright install --with-deps chromium ; pnpm test:e2e ; pnpm audit --prod --audit-level=high ; pnpm local:up ; docker compose up -d --wait app worker ; curl --fail http://localhost:3000/readiness ; docker compose exec -T postgres psql (marqueur synthétique INSERT/SELECT/DELETE system_probe) ; docker compose down ; docker compose up -d --wait app worker ; vérification que docker compose ps --status running -q est vide après arrêt. Aucun effacement de volume.


## Fichiers
- Identité/config/HTTP : src/modules/auth/{auth,environment,response,server}.ts ; src/app/api/auth/[...all]/route.ts ; src/instrumentation.ts.
- Domaine et sécurité : src/modules/organizations/{service,validation}.ts ; src/server/security/{http,tenant}.ts ; src/app/api/organizations/route.ts, organizations/[organizationId]/route.ts et platform/organizations/[organizationId]/route.ts.
- PostgreSQL : prisma/schema.prisma, quatre migrations ci-dessous ; infra/postgres/{init,auth-role}.sql.
- Installation/exécution : package.json, pnpm-lock.yaml, .env.example, .gitignore, docker-compose.yml, .github/workflows/ci.yml, playwright.config.ts.
- Tests : tests/integration/{auth,tenant-security}.test.ts ; tests/e2e/auth-tenant.spec.ts ; tests/unit/{auth-config,auth-response}.test.ts. Tests existants conservés.
- Documents : AGENTS.md, README.md, docs/{ARCHITECTURE,DATA_MODEL,MULTI_TENANCY,RLS,RUNBOOKS,SECURITY,LOT_1_REVIEW}.md, ADR 0006.

## Migrations explicites
1. 20261004000000_auth_tenant_rls : identités Better Auth, organisations/adhésions/audit ; permissions ; schéma privé ; fonctions de contexte ; ENABLE/FORCE RLS ; triggers.
2. 20261004000100_fix_audit_trigger : branches séparées Organization/Membership ; évite une référence OLD.role invalide sur Organization, garde le verrou du dernier OWNER.
3. 20261004000200_admin_reason_required : refus explicite de justification SQL NULL.
4. 20261004000300_revoke_identity_sessions : révocation des sessions lors d’un changement de rôle plateforme/MFA ou dévérification email.

Bootstrap explicite du rôle tony_auth pour les volumes existants ; CREATE ON DATABASE seulement au migrateur pour créer le schéma privé. Aucune suppression de données/volume.

## Architecture / authentification
Better Auth 1.7.7 avec adaptateur Prisma 1.7.7, plugin twoFactor, email/mot de passe, vérification email obligatoire. Mot de passe hashé, 12–128 caractères ; reset révoque les sessions. Session serveur de sept jours, mise à jour quotidienne, cache cookie désactivé. Cookies HttpOnly/SameSite=Lax, Secure avec HTTPS. Les tokens bearer sont supprimés des réponses HTTP publiques ; conservés uniquement dans le plan serveur.

Toute requête auth mutante exige l’origine configurée. Configuration Zod, secret explicite non placeholder, comptes DB de noms distincts, origine normalisée. Email local via table privée AuthMail ; configuration refusée hors loopback. Rate limiting persistant, bucket local partagé, aucun x-forwarded-for client de confiance ; 20 connexions/minute, cinq resets/minute, limites Better Auth de signup conservées. Retry-After standard adapté depuis X-Retry-After.

OWNER/MEMBER sont des rôles Membership, PLATFORM_ADMIN un attribut User global non accepté au signup. Pas de moteur de permissions générique, de plugin organization/invitations/teams ou d’UI Lot 2. Création d’organisation atomique avec OWNER et audit. MEMBER lit, OWNER peut modifier les paramètres et rôles autorisés ; dernier OWNER protégé. Les routes implémentées sont la fondation API, pas un CRUD complet de gestion d’équipe.

## Tenant context / RLS
Trois principaux non superuser/non BYPASSRLS : tony_migrator offline, tony_auth limité aux identités, tony_app limité aux tenants. Aucun SET ROLE entre eux. Le runtime tenant ne peut lire ni sessions ni credentials, ni tables privées.

Aucun GUC client ne donne d’autorisation. open_context vérifie dans PostgreSQL le token, l’expiration, l’email et la Membership ; contexte privé indexé par backend_pid + transaction_id. current_context revalide les conditions dans les politiques. withTenant ouvre/ferme dans la transaction ; un autre passage au pool ne récupère pas de droit. ENABLE et FORCE sur organization, membership, audit_log ; absence de contexte = zéro ligne / écritures refusées. Privilèges par colonne ; aucun INSERT/DELETE direct tenant.

Fonctions SECURITY DEFINER du migrateur, search_path fixe, objets qualifiés, aucun SQL dynamique, EXECUTE PUBLIC révoqué. Le migrateur possède une politique infrastructure explicite et reste un élément de confiance offline. L’ADR 0006 explique pourquoi un simple SET organizationId et une vérification applicative seraient insuffisants.

## Administrateur / audit
Consultation plateforme en lecture seule, session valide, MFA activée, justification obligatoire (10–200 caractères). authorize_admin_access commit audit et grant avant la transaction de consultation ; open_context refuse un grant créé dans la même transaction. Une lecture suivie de ROLLBACK conserve donc sa trace. Grant lié à session/organisation, initiation valable une minute. Aucun accès admin implicite.

Audit append-only : privilèges et trigger empêchent UPDATE/DELETE, y compris pour le migrateur dans ces opérations. Événements : création organisation, paramètres, permissions, sessions ordinaires/admin, révocations, identité sensible, consultations admin avec raison/corrélation. Pas de token dans l’audit. Actions du brief absentes du Lot 1 (abonnement, numéro, automatisation, export, suppression métier) à auditer lorsqu’elles seront introduites.

## Preuves cross-tenant et négatives
Tests directs via Pool pg réellement connecté comme tony_app, fixtures UUID synthétiques A/B et utilisateurs distincts. Aucun mock de politique.
- OWNER A et MEMBER A lisent uniquement A ; non-membre, utilisateur B, token invalide/expiré et email non vérifié refusés (42501).
- SELECT tenant sans contexte ou GUC falsifié : zéro ligne sur organization/membership/audit_log.
- UPDATE ciblant B : zéro ligne ; DELETE des trois tables et INSERT de Membership falsifiée : refus 42501. Colonnes d’identité/tenant non modifiables par les privilèges runtime.
- MEMBER ne peut escalader ni modifier les paramètres ; OWNER peut modifier/promotion autorisée avec audit ; dernier OWNER ne peut se rétrograder.
- Tables d’identité/privées et SET ROLE interdits ; DDL refusé et flags de rôle/ownership vérifiés par les tests Lot 0.
- Contexte non remplaçable dans la transaction, non persistant après commit ; révocation session invalide immédiatement le contexte dans les tests READ COMMITTED.
- Admin sans MFA/raison, raison NULL et utilisateur ordinaire en mode admin : refus ; grant même transaction : refus ; consultation B n’expose pas A, reste lecture seule et audit survit au ROLLBACK.
- Signup ne peut injecter PLATFORM_ADMIN/MFA ; vérification, mauvais mot de passe, signout, reset, TOTP valide/invalide, session absente avant second facteur, révocation d’une session antérieure au changement MFA ; rotation des headers IP ne contourne pas la limite.
- HTTP desktop/mobile : organisations distinctes, propre organisation 200, étrangères/nonexistantes 404, origine étrangère 403, session révoquée 401, pas de token session dans JSON.

## Corrections et discipline de tests
Corrections des causes : permission CREATE manquante pour le migrateur, déclencheur audit utilisant un champ du mauvais record, contrôle d’origine sans cookie, en-tête Retry-After, corps vide des redirections email, exécution des fonctions SQL void sans désérialisation Prisma, justification NULL et assurance des sessions antérieures à MFA. Secret éphémère CI masqué avant GITHUB_ENV.

Les scénarios de tests utilisent une DB synthétique jetable. Le compteur anti-abus est remis à zéro avant chaque scénario indépendant ; E2E sérialisés pour éviter le partage concurrent du bucket local. Le test anti-abus conserve ses 21 tentatives successives et exige 429. Aucun test supprimé/ignoré, aucune assertion relâchée, aucun BYPASSRLS de test runtime, aucun downgrade de sécurité.

## Impact / limites et dettes
Isolation démontrée sous tony_app sans token de victime ni credential identité/migration. Le vol de ces secrets ou d’une session victime reste un incident critique ; RLS ne prétend pas protéger contre l’administrateur DB superuser. Les trois comptes restent séparés.

Outbox locale uniquement : fournisseur email réel requis avant ouverture client ; pas de données réelles ou de production. Braces demeure une dette dev-only documentée ; audit production propre. Restrictions Mac Docker/PostgreSQL/Chromium : gates exécutées sur Linux GitHub, pas revendiquées localement. Vercel inchangé.

Grant administrateur réutilisable par SQL direct pendant sa minute d’initiation si le rôle runtime ET une session admin valide sont possédés ; toutes ces lectures restent rattachées à un audit commité. La transaction peut dépasser cette minute ; les services Prisma utilisent leurs bornes transactionnelles par défaut. Révocation réévaluée sous READ COMMITTED ; autres niveaux d’isolation peuvent conserver un snapshot jusqu’à fin de transaction et ne sont pas utilisés par les services.

Contextes privés abandonnés après abort/connexion perdue ne donnent aucun droit à une nouvelle transaction ; nettoyage global à prévoir avant charge soutenue. Grants expirés nettoyés à la consultation suivante. Proxies/buckets de production, sauvegarde/PITR/restauration, revue opérationnelle restent à valider avant production. Pas d’interface compte/équipe, aucun Lot 2.

Pas de divergence du périmètre Lot 1 ; choix structurants documentés dans ADR 0006 : plan identité séparé et capacités transactionnelles SQL, organisation métier hors plugin Better Auth, email fake local jusqu’au fournisseur réel. Ces choix et les limites ci-dessus sont soumis à la revue humaine.

Rollback : arrêter services, conserver volume et migrations ; pas de down migration destructive ni retour à une application moins protégée pour servir les tenants. Fusion/déploiement et suite restent soumis à revue. ARRÊT après Lot 1.
