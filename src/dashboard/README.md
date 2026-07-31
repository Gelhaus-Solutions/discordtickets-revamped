# Discord Tickets Portal

The SvelteKit web app for interacting with the bot via its API. It is the fork's version of `discordtickets-portal`, vendored into this repository so the UI and the bot stay in sync.

> [!NOTE]
>
> This is bundled with the bot; you don't need to download or deploy it separately. The bot serves it from `build/`.

## Working on it

This app has its own dependency tree and its own lockfile, separate from the bot's.

```sh
npm install
npm run dev     # vite dev server
npm run build   # produces build/, which is what the bot serves
npm run lint
```

> [!IMPORTANT]
>
> `build/` is generated, not committed — it is gitignored. The bot's `postinstall` builds it when it is missing, CI builds it for the Docker image and the release tarball, and `npm run dashboard.build` from the repository root rebuilds it. After changing any `.svelte`, CSS or route file you must rebuild, or your change will not appear in the running bot.
