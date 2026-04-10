const {
	spawn,
	Pool,
	Thread,
	Worker,
} = require('threads');
const { cpus } = require('node:os');

/**
 * Create a single-use thread pool
 * @param {number} num fraction of available CPUs to use (ceil'd), or absolute number
 * @param {string} name name of file in workers directory
 * @param {function} fun async function
 * @param {import('threads/dist/master/pool').PoolOptions} options
 * @returns {Promise<any>}
 */
async function quickPool(num, name, fun, options) {
	const pool = reusablePool(num, name, options);
	try {
		return await fun(pool);
	} finally {
		pool.settled().then(() => pool.terminate());
	}
};

/**
 * Create a multi-use thread pool
 * @param {number} num fraction of available CPUs to use (ceil'd), or absolute number
 * @param {string} name name of file in workers directory
 * @param {import('threads/dist/master/pool').PoolOptions} options
 */
function reusablePool(num, name, options) {
	const size = num < 1 ? Math.ceil(num * (parseInt(process.env.CPU_LIMIT) || cpus().length)) : num;
	const pool = Pool(() => spawn(new Worker(`./workers/${name}.js`)), {
		...options,
		size,
	});
	return pool;
};

/**
 * Spawn one thread, do something, and terminate it
 * @param {string} name name of file in workers directory
 * @param {function} fun async function
 * @returns {Promise<any}
 */
async function quick(name, fun) {
	const thread = await spawn(new Worker(`./workers/${name}.js`));
	try {
		// ! this await is extremely important
		return await fun(thread);
	} finally {
		Thread.terminate(thread);
	}
};

/**
 * Spawn one thread
 * @param {string} name name of file in workers directory
 * @returns {Promise<{terminate: function}>}
 */
async function reusable(name) {
	const thread = await spawn(new Worker(`./workers/${name}.js`));
	thread.terminate = () => Thread.terminate(thread);
	return thread;
};

// Pools are created lazily below to avoid spawning many workers at module
// load time which can cause resource contention and init timeouts.

function lazyPool(num, name, options) {
	let _pool = null;
	return {
		async queue(fn) {
			if (!_pool) _pool = reusablePool(num, name, options);
			try {
				return await _pool.queue(fn);
			} catch (err) {
				// Retry once quickly, in case the worker spawn timed out transiently
				try {
					await new Promise(r => setTimeout(r, 100));
					return await _pool.queue(fn);
				} catch (err2) {
					// If this is the crypto pool, fall back to in-process crypto
					if (name === 'crypto') {
						try {
							// Lazy-require local crypto implementation
							const { decrypt, encrypt } = require('./crypto');
							const pseudo = {
								decrypt: data => decrypt(data),
								encrypt: data => encrypt(data),
							};
							console.warn('[threads] crypto pool unavailable — falling back to in-process crypto');
							return await Promise.resolve(fn(pseudo));
						} catch (fallErr) {
							console.error('[threads] crypto fallback failed', fallErr);
							throw fallErr;
						}
					}
					console.error('[threads] pool.queue failed for', name, err2 || err);
					throw err2;
				}
			}
		},
		settled() {
			return _pool ? _pool.settled() : Promise.resolve();
		},
		terminate() {
			return _pool ? _pool.terminate() : Promise.resolve();
		},
		// internal getter for cases that need the real pool
		_getPool() {
			if (!_pool) _pool = reusablePool(num, name, options);
			return _pool;
		},
	};
}

const pools = {
	crypto: lazyPool(.5, 'crypto'),
	export: lazyPool(.33, 'export'),
	import: lazyPool(.33, 'import'),
	stats: lazyPool(.25, 'stats'),
	transcript: lazyPool(.5, 'transcript'),
};

module.exports = {
	pools,
	quick,
	quickPool,
	reusable,
	reusablePool,
};
