# Intelligence artificielle

## État du Lot 0
Aucun appel OpenAI ni prompt métier au Lot 0. AIProvider/FakeAIProvider à introduire au lot concerné.

## Exigences et suites
Prompts centralisés, versionnés et testés. Structured output validé par Zod ; retry contrôlé, journalisation sans transcript et fallback fonctionnel. La capture demande/SMS doit continuer lors de panne IA. Données IA non fiables : aucune autorisation ni action sensible dérivée sans contrôle. Confiance explicite, prix issus catalogue, scoring déterministe. Audio temporaire : statut suppression, retry borné et alerte sur DELETE_FAILED. Transcriptions et contexte support protégés par tenant ; support lecture seule puis confirmation explicite pour modifications.
