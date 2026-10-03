# Modèle de données

## État du Lot 0
Seule table implémentée : system_probe(id TEXT PRIMARY KEY), une ligne foundation. Sonde sans données personnelles, pas tenantée. Aucune entité métier introduite.

## Exigences et suites
Lots futurs : Organization/OrganizationSettings, User/Membership ; Contact/Address, InboundRequest, Opportunity/Score/ScoreVersion, ServiceTemplate/Category, Task ; Call/Participant/ProviderEvent, Transcript/Segment/Summary, Message/Template ; FormTemplate/Field/Submission/Attachment ; Appointment, AutomationRule/Execution ; Referral/Code/Reward ; Subscription/UsageEvent, WebhookEvent, AuditLog, SupportConversation/Diagnostic. Relations tenantées avec organizationId et contraintes composites pour empêcher les références cross-tenant. UUIDs, timestamps UTC, index tenant + filtres, montants en unités mineures. Migration des entités au lot concerné.
