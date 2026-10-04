# ADR 0007 — Shell, rendu et navigation

Date : 2026-10-04. Statut : implémenté pour revue Lot 2.

Le Lot 2 reste une fondation UI, sans nouveau domaine, table, migration ni dépendance. Il réutilise les tokens CSS, dictionnaires fr-FR/en-GB et primitives HTML natives (dialog avec showModal) pour le focus, Escape et l’inertie du fond.

Le document HTML et les payloads RSC du shell contiennent uniquement présentation et paramètres de route non réputés autorisés. Une API dédiée lit la session Better Auth côté serveur, refuse PLATFORM_ADMIN dans ce shell ordinaire, valide l’UUID et passe par readOrganizationIdentity/withTenant/RLS. Seuls id/name sortent vers le navigateur autorisé. Pas d’adhésions, email, cookie, token ou audit dans le DTO. Aucune lecture tenant sous tony_auth.

Les liens tenant utilisent une navigation de document entière : aucun prefetch Next ni cache du routeur client pour ces pages. Les rares Link vers l’accueil public désactivent le prefetch. L’API répond private/no-store et Vary Cookie ; fetch est no-store. Aucun cache global, localStorage ou persistance de tenant/préférence.

À pagehide, le DOM privé est masqué synchroniquement avant une éventuelle capture bfcache ; pageshow, focus et retour de visibilité effacent le DTO puis revalident. La déconnexion masque avant l’appel et remplace le document par l’accueil. Un navigateur déjà ouvert peut afficher le résultat d’une lecture précédemment autorisée tant qu’aucun événement de revalidation n’est survenu ; une révocation externe ne peut effacer rétroactivement une donnée déjà transmise. Chaque nouvelle lecture/navigation refait les vérifications PostgreSQL. Aucun flux admin ni grant implicite.

Conséquence : navigation moins instantanée qu’une transition Next client, mais frontière de cache explicite pour ce petit shell. Optimisation future seulement avec tests de session, RSC, prefetch et historique préservés. Pas de chiffres fictifs ni d’action CRM ; le formulaire de présentation annonce explicitement qu’il ne transmet/enregistre rien.

Les captures Playwright desktop/mobile/320px et états loading/error sont conservées comme artifacts CI pour inspection visuelle humaine par l’agent. Elles ne contiennent que fixtures synthétiques.
