# Row Level Security — Lot 1

ENABLE et FORCE RLS sur organization, membership et audit_log. tony_app est non propriétaire, sans superuser/BYPASSRLS, sans héritage du migrateur ni accès aux tables d’identité. Sans contexte valide, SELECT renvoie zéro ligne et aucune écriture tenant n’est autorisée.

Un GUC défini par le client n’autorise rien. open_context vérifie directement la session, son expiration, l’email vérifié et la Membership dans PostgreSQL. Le contexte privé est lié au backend et à la transaction ; current_context revalide ces conditions dans les politiques. withTenant ouvre, utilise puis ferme le contexte dans une transaction. Retour au pool sans autorisation persistante.

OWNER lit son organisation et ses adhésions et peut modifier les paramètres et rôles autorisés. MEMBER lit, sans pouvoir modifier. Le dernier OWNER ne peut être rétrogradé. tony_app ne possède aucun INSERT/DELETE direct sur les tables tenantées ; la création d’organisation passe par une fonction contrôlée qui crée atomiquement l’adhésion OWNER et l’audit.

PLATFORM_ADMIN n’a aucun accès implicite. Consultation en lecture seule avec MFA, raison et grant court, dont l’audit est commité avant la transaction de consultation. Un ROLLBACK de lecture ne supprime pas cet audit.

Les fonctions SECURITY DEFINER ont un propriétaire offline, un search_path fixe, aucun SQL dynamique et aucun EXECUTE PUBLIC. Le compte migrateur reste un principal de confiance, distinct du runtime. Voir ADR 0006 pour les limites et le modèle de menace.

Preuves exécutables : tests/integration/tenant-security.test.ts utilise réellement tony_app pour les lectures/écritures cross-tenant, contextes absents ou falsifiés, révocation, escalade, accès privés et DDL ; tests/integration/database.test.ts conserve les contrôles de moindre privilège. Aucun mock de RLS.
