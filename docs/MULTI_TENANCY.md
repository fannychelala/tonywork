# Multi-tenant

## État du Lot 0
Aucune donnée client ni endpoint tenant au Lot 0. Le rôle applicatif possède des privilèges DML locaux, sans propriété ni pouvoir DDL.

## Exigences et suites
Lot 1 : tenant issu de session et Membership vérifiée. Jamais prendre organizationId de l’UI comme autorisation. Services imposent permissions, repositories filtrent tenant, relations composites imposent cohérence. RLS assure défense supplémentaire. Accès platform admin distinct et audité. Jobs et webhooks résolvent le tenant via données serveur autorisées ; caches tenantés si introduits. Réponses 404 homogènes pour éviter de révéler l’existence de données étrangères.
