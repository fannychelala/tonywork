# Runbooks locaux

## État du Lot 0
Lancement : pnpm local:up ; application sur localhost:3000, PostgreSQL sur localhost:5432. health = processus vivant ; readiness = DB accessible + migration sonde présente. Logs : docker compose logs app worker migrate. Arrêt : pnpm local:down, données conservées.

## Exigences et suites
Si readiness 503 : vérifier postgres healthy, logs migration, DATABASE_URL et droits app. Ne pas afficher credentials dans un rapport. init.sql est exécuté uniquement sur volume neuf : ne pas effacer un volume avec données pour le relancer. Modifier les rôles avec une migration/procédure explicite. Reset réservé aux données locales jetables, avec décision humaine de suppression du volume. Déploiement futur : backups automatiques/PITR et restauration réellement testée avant ouverture ; aucune procédure production validée ici. Worker Lot 0 n’exécute rien et s’arrête sur SIGTERM/SIGINT. Rollback Lot 0 : arrêter services, revenir au commit précédent, conserver volume ; aucune suppression destructive automatique.
