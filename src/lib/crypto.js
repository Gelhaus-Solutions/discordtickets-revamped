const Cryptr = require('cryptr');

let decrypt, encrypt;

if (process.env.DISABLE_ENCRYPTION === 'true') {
	if (process.env.NODE_ENV === 'production' && process.env.I_KNOW_DISABLE_ENCRYPTION_IS_DANGEROUS !== 'true') {
		throw new Error(
			'DISABLE_ENCRYPTION=true is set while NODE_ENV=production. ' +
			'This stores ticket messages, feedback, etc. in PLAINTEXT. ' +
			'If this is intentional (e.g. one-off migration), also set ' +
			'I_KNOW_DISABLE_ENCRYPTION_IS_DANGEROUS=true to acknowledge.',
		);
	}
	const banner = '!!! DISABLE_ENCRYPTION=true — ticket data is stored in PLAINTEXT !!!';
	// stderr so the warning is visible regardless of logger setup
	process.stderr.write(`\n${banner}\n${'!'.repeat(banner.length)}\n\n`);
	encrypt = data => data;
	decrypt = data => data;
} else {
	const cryptr = new Cryptr(process.env.ENCRYPTION_KEY);
	decrypt = cryptr.decrypt.bind(cryptr);
	encrypt = cryptr.encrypt.bind(cryptr);
}

module.exports = {
	decrypt,
	encrypt,
};
