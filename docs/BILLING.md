# Facturation

## État du Lot 0
Aucun abonnement ni prix codé, aucun paiement possible. BillingProvider/FakeBillingProvider et Resend EmailProvider prévus aux lots pertinents.

## Exigences et suites
Stripe envisagé ; plans/quota configurables, trial, grace period, cancel et failed payment. UsageEvent append-only/idempotent trace minutes/SMS/IA/transcription/stockage ; distinguer coût réel, valeur potentielle, CA déclaré et attribué. Referral récompensé après premier paiement valide, anti-abus. Webhooks de facturation signés et idempotents. Ne pas activer provider réel en local par défaut.
