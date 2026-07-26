# Discord Tickets Portal

The SvelteKit web app for interacting with the bot via its API. It is the fork's version of `discordtickets-portal`, vendored into this repository so the UI and the bot stay in sync.

> [!NOTE]
>
> This is bundled with the bot; you don't need to download or deploy it separately. The bot serves it from `build/`.

## Working on it

This app has its own dependency tree and uses **npm**, unlike the bot (which uses bun).

```sh
npm install
npm run dev     # vite dev server
npm run build   # required: `build/` is committed and is what the bot serves
npm run lint
```

> [!IMPORTANT]
>
> The Docker image does **not** build the dashboard — `build/` is committed to git. After changing any `.svelte`, CSS or route file you must run `npm run build` and commit the result, or your change will not appear in the running bot.
