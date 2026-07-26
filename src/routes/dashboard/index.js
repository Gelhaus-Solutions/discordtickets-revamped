const fs = require('fs');
const path = require('path');

module.exports.get = fastify => ({
	handler: async (req, res) => {
		// Resolved against this file's location, not the working directory. In
		// Docker the cwd is /home/container while the app lives in /app, so the
		// previous process.cwd() form made all three of these routes 404.
		const file = path.join(__dirname, '..', '..', 'dashboard', 'custom', 'index.html');
		if (!fs.existsSync(file)) return res.code(404).send('Not found');
		const html = fs.readFileSync(file, 'utf8');
		res.type('text/html; charset=utf-8').send(html);
	},
});
