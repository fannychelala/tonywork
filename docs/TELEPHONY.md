# Téléphonie

## État du Lot 0
Aucun SDK, numéro réel ni appel externe. TelephonyProvider et FakeTelephonyProvider à introduire avec les premiers workflows.

## Exigences et suites
Contrat cible : provision/release numéro, appel sortant, SMS, état appel, start/stop/delete recording, vérification webhook. Twilio envisagé, domaine indépendant. Signature sur payload original et URL canonique contrôlée ; validation Zod, persistance idempotente, réponse rapide, jobs. Tester doublons, désordre, retries, événement ancien, appel court, simultané, SMS échoué. Gate 1 : vraie ligne validée ; Gate 2 : tests téléphones réels. Ne pas poursuivre les dépendances téléphoniques avant ces validations.
