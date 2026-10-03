# Internationalisation

## État du Lot 0
Dictionnaires typés fr-FR et en-GB dans src/shared/i18n/messages.ts ; page fr-FR. Formats Intl avec devise et timezone explicites. Tests EUR/JPY/KWD et changement d’heure.

## Exigences et suites
Séparer userLocale, organizationDefaultLocale, prospectLocale et langue opérateur. CountryConfiguration et TradeConfiguration à définir avec les domaines ; ne pas supposer pays/langue/devise/adresse/numéro. Traductions des messages externes et back-office. Introduire une librairie adaptée à Next, telle next-intl, quand préférences/routage seront construits, avec ADR. Aucun changement silencieux de locale tenant via langue admin.
