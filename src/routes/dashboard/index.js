const fs = require('fs');
const path = require('path');

module.exports.get = fastify => ({
	handler: async (req, res) => {
		const file = path.join(process.cwd(), 'src', 'dashboard', 'custom', 'index.html');
		if (!fs.existsSync(file)) return res.code(404).send('Not found');
		const html = fs.readFileSync(file, 'utf8');
		res.type('text/html; charset=utf-8').send(html);
	},
});
