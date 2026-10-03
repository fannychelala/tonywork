# Row Level Security

## État du Lot 0
RLS délibérément différée au Lot 1 : aucune table tenantée au Lot 0. Tests PostgreSQL vérifient le rôle runtime sans superuser/BYPASSRLS, non propriétaire et sans CREATE.

## Exigences et suites
Chaque table sensible : ENABLE ROW LEVEL SECURITY puis FORCE ROW LEVEL SECURITY ; politiques USING et WITH CHECK sur organizationId. Contexte établi avec set_config(..., true) dans la même transaction que les requêtes. Sans contexte : refus par défaut. Ne jamais SET global sur connexion poolée. Séparer tony_migrator/tony_app ; runtime ne doit jamais hériter du rôle propriétaire. Tests obligatoires sur vraies connexions runtime : A ne lit/modifie/supprime/insère pas B ; absence contexte ; retour pool ; relations cross-tenant ; accès admin audité. Pas de commande test:rls vide prétendant couvrir une sécurité absente.
