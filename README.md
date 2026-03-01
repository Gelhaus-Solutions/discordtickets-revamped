> A fork for discordtickets/bot, with more features, and less bugs

## Changes
A quick overview of what has changed:
- Thread mode, for unlimited tickets, and better overview.
- Forum mode, for creating tickets in a forum channel. (Used for public support, uncommon use-case)
- A feedback portal with all the feedback given by the users.
- Merged the UI (discordtickets-portal) into this repo for better overview, and easier changes.
- HTML Transcripts, alongside a central dashboard for all of them for admins.
- Auto-Assign feature. (The first to comment staff member will get assigned)
- Backup categories. (for the standard ticket method, channel)
- "Close with Reason" button.
- No "total limit" for Threads / Forum tickets.
- Bot appearance customization, per-server.
- And much more!

## Here's how to use it:
### Disclaimer
**We do not support bare-metal, Pterodactyl, or any other installation method, other than docker-compose.**
This repo is also **not** production ready, so we are not responsible for any damanges.
Use at your own risk.
### New Instance
Simply use our [new docker-compose.yml](https://github.com/Gelhaus-Corp/discordtickets-revamped/blob/main/docker-compose.yml) file, to install a new instance with stable releases. (Change the image to `:main` for development builds.)
### Old Instance
This is a bit more complicated, due to many DB and schema changes.
1. Change your bot image on your docker-compose.yml to `ghcr.io/gelhaus-corp/discordtickets-revamped:latest` or with `:main` for experimental builds.
2. Before updating the stack itself, take a backup of your bot and MySQL data.
3. Run `docker-compose down` and `docker-compose up -d`.
4. Go into your bot container with `docker exec -it YOUR_CONTAINER_NAME /bin/sh` and enter `cd /app`.
5. Now run `node scripts/fix-revamp.js` and then `exit`.
6. Now restart your stack one more time: `docker-compose down` & `docker compose up -d`.
7. Finally go into your dashboard to see if everything went right, if not, restore your backup and try again.