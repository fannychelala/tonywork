# Design system

## État du Lot 0
Tokens CSS centralisés : espacement, couleurs sémantiques, typographies système, arrondis, ombre et focus. Page responsive sans assets distants. Focus visible, lien d’évitement et main focalisable.

## Exigences et suites
Lot 2 : composants partagés boutons/formulaires/dialogues/drawers/skeletons/états vides. Cibles tactiles ≥44px, erreurs associées aux champs, navigation clavier, contraste AA. Texte court et concret, interface chaleureuse sobre, actions évidentes. Pas de tableaux desktop simplement réduits sur mobile. L’UI Lot 0 indique développement et absence collecte ; aucun bouton inactif trompeur.

## Lot 2 implémenté pour revue
Primitives partagées dans src/shared/ui : Button (types/variants/44px), Field (label/erreur/aria), Card, Alert, EmptyState, Skeleton et Dialog. Dialog natif showModal : fond inerte, focus initial sur Fermer, boucle clavier native, Escape et restitution du focus au déclencheur. Drawer réutilise la même primitive. Navigation à gauche sur desktop et panneau mobile, cinq écrans sans logique métier.

Textes shell centralisés fr-FR/en-GB. Aucun asset distant, aucune dépendance nouvelle. Formulaire de présentation explicitement sans envoi/enregistrement. CSS du shell scoped .app-shell/.shell-* ; tokens Lot 0 préservés et page fondation conservée. Captures desktop/mobile/320px et interactions clavier en CI pour inspection visuelle avant validation.
