# ADR 0006 — Sessions et frontière PostgreSQL

Date : 2026-10-04. Statut : implémenté pour revue Lot 1.

## Problème
Un rôle SQL non propriétaire peut falsifier un GUC `app.organization_id`. Une politique fondée uniquement sur ce GUC ne protège donc pas contre l’accès SQL direct avec le rôle applicatif. Un audit administrateur placé uniquement dans la transaction de lecture peut aussi être effacé par ROLLBACK.

## Décision
Better Auth 1.7.7, adaptateur Prisma, email/mot de passe, vérification obligatoire, sessions serveur révocables sans cache cookie, plugin twoFactor compatible MFA. Les rôles OWNER/MEMBER concernent Membership ; PLATFORM_ADMIN est un attribut User distinct, non accepté depuis les entrées signup/update. Il ne donne aucun accès client implicite.

Trois comptes distincts : migration `tony_migrator`, identité `tony_auth`, tenant `tony_app`, sans superuser/BYPASSRLS/CREATEROLE. Aucune adhésion PostgreSQL entre ces comptes. tony_auth n’a pas de droits sur organization/membership/audit ; tony_app n’a pas de droits sur les tables d’identité. Le secret du compte identité constitue un élément de confiance du backend d’authentification et n’est jamais une credential utilisateur.

Les fonctions SECURITY DEFINER appartiennent au rôle migration offline. Elles ont un search_path fixé, des objets qualifiés, aucun SQL dynamique et aucun EXECUTE PUBLIC. La politique infrastructure spécifique au rôle migration donne le droit aux opérations contrôlées des fonctions ; elle n’est pas héritée par runtime. ENABLE/FORCE RLS sur Organization, Membership et AuditLog.

`open_context` valide dans PostgreSQL une session Better Auth, sa date d’expiration, l’email vérifié et la Membership avant d’inscrire un contexte privé indexé par backend_pid + transaction_id. Les paramètres GUC sont ignorés. La RLS réévalue session et membership et refuse sans contexte. Chaque service agit dans la même transaction ; close_context supprime le contexte avant commit. Les lignes abandonnées ne peuvent pas réautoriser une transaction suivante et sont remplacées sur réutilisation de connexion ; nettoyage global à ajouter avant charge soutenue.

## Administrateur et audit
L’accès plateforme est lecture seule, requiert MFA activée et une justification. `authorize_admin_access` enregistre d’abord un audit et un grant privé (une minute). `open_context` exige que ce grant ait été créé dans une transaction antérieure déjà commitée, avec même session/tenant. Ainsi une lecture suivie de ROLLBACK ne supprime jamais sa trace. Un grant représente une consultation bornée ; la session doit rester valide et la RLS le réévalue. L’application génère un grant neuf par consultation. La possession simultanée du compte SQL runtime et d’une session admin valide permet de réutiliser le grant pendant sa minute de validité, mais toute lecture reste rattachée à l’audit préexistant.

Audit append-only par privilèges et trigger, y compris refus des UPDATE/DELETE au rôle migration. Triggers pour création/révocation session, changements d’identité sensibles, paramètres organisation et permissions. Les autres événements du brief (abonnement, numéro, automatisation, exports, suppressions) seront instrumentés au lot où ces actions apparaissent ; aucun faux endpoint hors périmètre.

## Périmètre et conséquences
Pas de plugin organization Better Auth : ce dernier gère les identités, tandis que les adhésions et organisations sont contrôlées par PostgreSQL/RLS, sans introduire invitations ou teams hors Lot 1. Pas d’UI compte ou navigation Lot 2. Pas de données réelles.

Email local via outbox privée SQL, jamais logs ni réponses publiques. Configuration refusée pour une URL non loopback avec cet adaptateur : aucun envoi réel ou déploiement production silencieux. Provider email réel à intégrer avant tout usage client, suivant le brief (Resend). Compte PLATFORM_ADMIN créé uniquement par procédure opérateur privilégiée ; l’API signup ne peut pas le créer.

Tests directs avec tony_app : contexte absent/falsifié, cross-tenant, sessions invalides/expirées/révoquées, rôle et escalade, lecture admin limitée et audit persistant après rollback. Les secrets serveur/identité ou migration et le vol d’une session victime restent hors menace du simple rôle tenant compromis ; leur compromission constitue un incident critique.

## Limitation du rate limiting local
Aucun header IP fourni par le client n’est réputé fiable. En local, Better Auth utilise son bucket partagé par route dans PostgreSQL (20 essais de connexion/minute et 5 resets/minute). Test de rotation de x-forwarded-for : la limite reste active. Avant production, configurer les proxies de confiance et les buckets par IP ; aucune configuration production n’est autorisée avec l’outbox locale.
