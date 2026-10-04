# Sécurité — Lot 1

Better Auth 1.7.7 avec adaptateur Prisma, email vérifié obligatoire, mots de passe 12–128 caractères, sessions serveur révocables sans cache cookie. Reset révoque les sessions. Cookies HttpOnly/SameSite=Lax, Secure avec HTTPS ; les réponses HTTP masquent les jetons bearer. Toute requête auth mutante exige l’origine configurée, y compris une connexion sans cookie.

MFA TOTP disponible et imposée pour toute consultation PLATFORM_ADMIN. L’attribut plateforme ne peut être injecté au signup. L’activation et l’épreuve TOTP sont testées réellement. Limitation des tentatives stockée en PostgreSQL ; aucun header IP client n’est fiable. Bucket partagé local, en-tête standard Retry-After ajouté depuis celui fourni par Better Auth.

Trois rôles DB séparés : migrateur offline, identité, tenant. RLS forcée et contexte vérifié par PostgreSQL ; audit append-only. Les secrets d’identité/migration sont des éléments de confiance critiques du backend. Le rôle tenant seul ne permet ni accès aux sessions ni falsification du contexte. Voir ADR 0006.

Adaptateur email local : outbox privée, aucune émission, aucun token dans les logs. Configuration refusée hors loopback. Aucun usage production/client avant provider réel, proxies de confiance, sauvegarde/restauration et revue opérationnelle. Les fixtures et emails example.invalid sont synthétiques.

Audit couvre sessions administrateur/utilisateur, révocations, changements d’identité sensibles, paramètres, permissions, création d’organisation et consultation admin. Les actions futures du brief seront auditées à leur introduction ; aucun endpoint hors périmètre.

Audit production propre à vérifier sur chaque livraison ; braces est une dette d’outillage connue, sans downgrade/override risqué. CodeQL, Dependency Review et push protection GitHub. Aucune conformité réglementaire revendiquée. Vercel exclu du Lot 1.

## Shell Lot 2
API de DTO minimal (id/name) autorisée par session et withTenant/RLS. Aucun tenant dans HTML/RSC initial ; pas d’adhésion/token/cookie/audit dans le DTO. PLATFORM_ADMIN refusé dans ce shell, aucun grant implicite. Fetch/API no-store, navigation tenant par document sans prefetch, masque synchrone au pagehide et avant déconnexion, revalidation pageshow/focus/visibilité. Voir ADR 0007 pour la limite d’un contenu précédemment autorisé déjà transmis au navigateur. La dette de réutilisation courte d’un grant admin reste acceptée, sans extension ni assouplissement.
