const semver = require('semver');
const { short } = require('leeks.js');
const ExtendedEmbedBuilder = require('./embed');
const { version: currentVersion } = require('../../package.json');

const REPO = 'Gelhaus-Solutions/discordtickets-revamped';

/** @param {import("client")} client */
module.exports = client => {
	client.log.info.cron('Checking for updates...');
	// This fork has its own release line (v1.x), so it checks its own releases —
	// not discord-tickets/bot, whose versions are unrelated to ours.
	fetch(`https://api.github.com/repos/${REPO}/releases`)
		.then(res => res.json())
		.then(async json => {
			if (!Array.isArray(json)) return client.log.warn('Failed to check for updates: unexpected response from GitHub');
			// releases are ordered by date, so a patch for an old version could be before the latest version
			const releases = json
				.filter(release => !release.prerelease)
				.sort((a, b) => semver.compare(semver.coerce(b.tag_name)?.version, semver.coerce(a.tag_name)?.version));
			const latestRelease = releases[0];
			if (!latestRelease) return client.log.info('No releases found');
			const latestVersion = semver.coerce(latestRelease.tag_name)?.version;
			const compared = semver.compare(latestVersion, currentVersion);

			switch (compared) {
			case -1: {
				client.log.notice('You are running a pre-release version of Discord Tickets (revamped)');
				break;
			}
			case 0: {
				client.log.info('No updates available');
				break;
			}
			case 1: {
				let currentRelease = releases.findIndex(release => semver.coerce(release.tag_name)?.version === currentVersion);
				if (currentRelease === -1) return client.log.warn('Failed to find current release');
				const behind = currentRelease;
				currentRelease = releases[currentRelease];
				const changelog = `https://github.com/${REPO}/releases/tag/${latestRelease.tag_name}`;
				const guide = `https://github.com/${REPO}#old-instance`;
				const { default: boxen } = await import('boxen');

				client.log.notice(
					short('&r&6A new version of Discord Tickets (revamped) is available (&c%s&6 -> &a%s&6)&r\n'),
					currentVersion,
					latestVersion,
					boxen(
						short([ // uses template literals to ensure boxen adds the correct padding
							`&6You are &f${behind}&6 version${behind === 1 ? '' : 's'} behind the latest version, &a${latestVersion}&6.&r`,
							`&6Changelog: &e${changelog}&r`,
							`&6Update guide: &e${guide}&r`,
						].join('\n')),
						{
							align: 'center',
							borderColor: 'yellow',
							borderStyle: 'round',
							margin: 1,
							padding: 1,
							title: 'Update available',
						}),
				);

				if (process.env.PUBLIC_BOT !== 'true') {
					const guilds = await client.prisma.guild.findMany({ where: { logChannel: { not: null } } });
					for (const guild of guilds) {
						const getMessage = client.i18n.getLocale(guild.locale);
						await client.channels.cache.get(guild.logChannel).send({
							embeds: [
								new ExtendedEmbedBuilder()
									.setColor('Blurple')
									.setAuthor({
										iconURL: latestRelease.author.avatar_url,
										name: latestRelease.author.login,
									})
									.setTitle(getMessage('misc.update.title'))
									.setDescription(getMessage('misc.update.description', {
										changelog,
										github: latestRelease.html_url,
										guide,
										version: latestRelease.tag_name,
									})),
							],
						});
					}
				}
				break;
			}
			}
		})
		.catch(error => {
			client.log.warn('Failed to check for updates');
			client.log.error(error);
		});
};
