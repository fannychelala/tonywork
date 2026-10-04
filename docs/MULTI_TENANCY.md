# Multi-tenant — Lot 1

User est une identité globale ; Membership relie un utilisateur à une Organization avec OWNER ou MEMBER. PLATFORM_ADMIN est un attribut global séparé, inaccessible à l’inscription. La seule présence d’un organizationId dans une URL ne constitue jamais une autorisation.

L’API tire le jeton d’une session Better Auth validée côté serveur. PostgreSQL vérifie cette session et l’adhésion dans la même transaction que les accès tenantés. RLS forcée constitue la frontière même en accès SQL direct avec tony_app. Les réponses de consultation non autorisées sont des 404 homogènes.

L’accès administrateur exige MFA et justification, est audité avant lecture et n’autorise aucune modification tenant. Pas d’invitations, de teams, de jobs tenantés ni de cache métier introduits dans ce lot. Ces workflows devront appliquer la même frontière lors de leur introduction.

Voir RLS.md et ADR 0006. Aucune donnée réelle ni ouverture client autorisée.
