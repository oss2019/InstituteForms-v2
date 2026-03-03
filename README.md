# Operations Guide — swevents.iitdh.ac.in

This VM serves a React frontend via Nginx and proxies API requests to a Node.js backend on port 4001. MongoDB runs locally. Use these commands to deploy changes and access the database.

## Paths and services
- Repo: /home/swevents/Documents/InstituteForms-v2
- Frontend build root (served by Nginx): /var/www/swevents
- Backend: Node.js app listening on 127.0.0.1:4001
- Nginx site config: /etc/nginx/sites-available/swevents (enabled via sites-enabled)
- Logs:
  - Nginx: /var/log/nginx/access.log, /var/log/nginx/error.log
  - Backend: pm2 logs or systemd journal (see below)
  - MongoDB: systemd journal; /var/log/mongodb/ if configured

## Frontend — build and deploy
```bash
# 1) Build (set API base to your site)
cd /home/swevents/Documents/InstituteForms-v2/frontend
npm ci
npm run build

# 2) Deploy build to Nginx web root
sudo rsync -a /home/swevents/Documents/InstituteForms-v2/frontend/dist/ /var/www/swevents/

# 3) Ensure permissions
sudo chown -R www-data:www-data /var/www/swevents

# 4) Test and reload Nginx (if config changed)
sudo nginx -t && sudo systemctl reload nginx

## Backend — install, run, restart
```bash
# 1) Install dependencies
cd /home/swevents/Documents/InstituteForms-v2/backend
npm ci


```bash
cd /home/swevents/Documents/InstituteForms-v2/backend
pm2 start npm --name "swevents" -- start
pm2 save
pm2 startup  # follow the printed command to enable on boot
pm2 logs instituteforms-backend --lines 200
```

## MongoDB — quick checks and access
```bash
# Service status
sudo docker exec -it mongodb mongo
```

Connect and select DB (replace with your DB name, e.g., instituteforms or mydb):
```bash
use mydb
show collections
db.users.countDocuments()
```
Keep this file updated as you change deploy paths or service names.