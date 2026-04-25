const fs = require('fs');
const path = require('path');

module.exports.get = fastify => ({
	handler: async (req, res) => {
		const file = path.join(process.cwd(), 'src', 'dashboard', 'custom', 'app.js');
		if (!fs.existsSync(file)) return res.code(404).send('Not found');
		const js = fs.readFileSync(file, 'utf8');
		res.type('application/javascript; charset=utf-8').send(js);
	},
});
