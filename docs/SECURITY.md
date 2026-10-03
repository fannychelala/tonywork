# Sécurité

## État du Lot 0
Configuration runtime validée par Zod ; erreurs sans credentials. Runtime PostgreSQL non superuser/non propriétaire/sans BYPASSRLS. Build sans accès DB. En-têtes nosniff, anti-frame, referrer policy et permissions désactivées. Image applicative exécutée par utilisateur node.

## Exigences et suites
Lot 1 : Better Auth, sessions révocables, email vérifié, cookies HttpOnly/Secure/SameSite, reset, protections brute force, rate limiting et audit append-only. MFA admin avant mise en service du back-office. CSP à définir selon UI effective ; microphone devra être autorisé lors du lot WebRTC. Aucun certificat ni conformité ISO/HDS/RGPD revendiqué. Secrets de production externes, journalisation minimisée, uploads privés et rétention documentée avant leur introduction.
