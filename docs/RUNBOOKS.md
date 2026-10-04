# Runbooks locaux

## État du Lot 0
Lancement : pnpm local:up ; application sur localhost:3000, PostgreSQL sur localhost:5432. health = processus vivant ; readiness = DB accessible + migration sonde présente. Logs : docker compose logs app worker migrate. Arrêt : pnpm local:down, données conservées.

## Exigences et suites
Si readiness 503 : vérifier postgres healthy, logs migration, DATABASE_URL et droits app. Ne pas afficher credentials dans un rapport. init.sql est exécuté uniquement sur volume neuf : ne pas effacer un volume avec données pour le relancer. Modifier les rôles avec une migration/procédure explicite. Reset réservé aux données locales jetables, avec décision humaine de suppression du volume. Déploiement futur : backups automatiques/PITR et restauration réellement testée avant ouverture ; aucune procédure production validée ici. Worker Lot 0 n’exécute rien et s’arrête sur SIGTERM/SIGINT. Rollback Lot 0 : arrêter services, revenir au commit précédent, conserver volume ; aucune suppression destructive automatique.

## Lot 1
Créer .env depuis .env.example avec un BETTER_AUTH_SECRET aléatoire privé. pnpm local:up exécute bootstrap-auth (mise à niveau explicite du rôle identité pour un ancien volume), puis migrations et services. Le droit CREATE ON DATABASE n’est accordé qu’au migrateur offline pour le schéma privé, jamais au runtime. En développement séparé : docker compose run --rm bootstrap-auth avant pnpm db:migrate.

Les migrations ajoutent les tables auth/tenant et corrigent le déclencheur d’audit sans suppression. Arrêt pnpm local:down sans -v. En cas de problème, arrêter l’application et conserver le volume ; ne pas revenir à un runtime moins protégé pour servir des données. Aucun rollback destructif automatique. Promotion PLATFORM_ADMIN uniquement par opérateur privilégié, suivie d’une MFA effectivement configurée et testée ; ne pas créer de compte client réel.

AuthMail est une outbox locale privée contenant des liens sensibles. Ne jamais l’exporter dans les rapports ni logs ; les tests ne lisent que leurs propres fixtures synthétiques. Production bloquée avec cet adaptateur. Nettoyage des contextes abandonnés et grants expirés à prévoir avant charge soutenue, sans désactiver RLS.
