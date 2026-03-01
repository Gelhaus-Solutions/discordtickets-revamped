const { execSync } = require('child_process');
const { existsSync } = require('fs');

/**
 * Run Prisma migrations automatically
 * @param {import('client')} client - The Discord client instance with logger
 * @returns {Promise<void>}
 */
async function runMigrations(client) {
	try {
		client.log.info('Checking for pending database migrations...');

		// Try to run migrations using the default schema location
		// (postinstall script places it at prisma/schema.prisma)
		const schemaPath = 'prisma/schema.prisma';

		// Check if schema exists, if not skip migrations
		// (this handles cases where migrations are handled elsewhere)
		if (!existsSync(schemaPath)) {
			client.log.info('Prisma schema not found at ' + schemaPath + ', skipping migrations');
			return;
		}

		// Run migrations using prisma migrate deploy (non-interactive)
		// This is safe for production as it only applies pending migrations
		try {
			execSync(
				`npx prisma migrate deploy`,
				{
					cwd: process.cwd(),
					stdio: 'inherit',
					env: { ...process.env }
				}
			);
			client.log.info('Database migrations completed successfully');
		} catch (error) {
			// Check if the error is just "no pending migrations"
			if (error.status === 0 || error.message.includes('No pending migrations')) {
				client.log.info('Database is up-to-date');
			} else {
				// If migrations are already handled by postinstall, this is OK
				client.log.warn('Could not verify migrations at runtime (may be handled by postinstall)');
			}
		}
	} catch (error) {
		client.log.warn(`Migration check failed: ${error.message}`);
		// Don't fail the bot startup for migration issues
		// The postinstall script should have already handled migrations
	}
}

module.exports = runMigrations;

