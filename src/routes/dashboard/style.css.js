const fs = require('fs');
const path = require('path');

module.exports.get = fastify => ({
	handler: async (req, res) => {
		const file = path.join(process.cwd(), 'src', 'dashboard', 'custom', 'style.css');
		if (!fs.existsSync(file)) return res.code(404).send('Not found');
		const css = fs.readFileSync(file, 'utf8');
		res.type('text/css; charset=utf-8').send(css);
	},
});
