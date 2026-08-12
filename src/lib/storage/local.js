const fs = require('fs/promises');
const { createReadStream } = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const {
	StorageError, assertKey,
} = require('./keys');

/**
 * Resolve a key against a root, and refuse anything that lands outside it.
 *
 * Separate from `assertKey` and separately exported so it can be tested on its
 * own: given the current key shape nothing can reach this and fail, which is
 * exactly why it would rot into decoration if the only way to exercise it were
 * through a key the shape check already rejects.
 *
 * @param {string} root absolute
 * @param {string} key
 * @returns {string} absolute path
 * @throws {StorageError} INVALID_KEY
 */
function confine(root, key) {
	const full = path.resolve(path.join(root, key));
	if (full !== root && !full.startsWith(root + path.sep)) {
		throw new StorageError('INVALID_KEY', `key escapes the storage root: ${key}`);
	}
	return full;
}

/**
 * Transcripts on the filesystem, under the data directory.
 *
 * The root is `<DATA_DIR>/user` and keys look like `transcripts/ticket-x.html`,
 * which resolves to exactly where transcripts have always been written — an
 * upgrade moves no files.
 */
class LocalStorage {
	/**
	 * @param {object} options
	 * @param {string} options.root absolute path the keys resolve against
	 */
	constructor({ root }) {
		this.name = 'local';
		this.root = path.resolve(root);
	}

	/**
	 * Key to absolute path, with both guards.
	 *
	 * `assertKey` rejects anything that is not the one shape we store, before
	 * any I/O happens at all. The resolve-and-confine below is the older guard
	 * from the transcript route, kept because defence that only exists in one
	 * layer is defence that disappears the day someone widens the other.
	 * @param {string} key
	 * @returns {string}
	 */
	resolve(key) {
		assertKey(key);
		return confine(this.root, key);
	}

	/**
	 * @param {string} key
	 * @param {Buffer|string} body
	 * @returns {Promise<{key: string, size: number}>}
	 */
	async put(key, body) {
		const full = this.resolve(key);
		await fs.mkdir(path.dirname(full), { recursive: true });

		// Written to a temp name and renamed into place: `rename` is atomic on
		// POSIX and replaces on Windows, so a reader can never catch a transcript
		// half-written. No fsync — this is a regenerable cache, and durability
		// across a power cut is not worth the latency on every ticket close.
		const tmp = `${full}.${process.pid}.${randomUUID()}.tmp`;
		try {
			await fs.writeFile(tmp, body);
			await fs.rename(tmp, full);
		} finally {
			await fs.rm(tmp, { force: true }).catch(() => {});
		}

		return {
			key,
			size: Buffer.byteLength(body),
		};
	}

	/**
	 * @param {string} key
	 * @returns {Promise<Buffer>}
	 * @throws {StorageError} NOT_FOUND
	 */
	async get(key) {
		const full = this.resolve(key);
		try {
			return await fs.readFile(full);
		} catch (error) {
			if (error.code === 'ENOENT') throw new StorageError('NOT_FOUND', `no object at ${key}`, { cause: error });
			throw new StorageError('UNAVAILABLE', `could not read ${key}: ${error.message}`, { cause: error });
		}
	}

	/**
	 * Callers are expected to `stat` first — once a stream has started there is
	 * no way back to regenerating the transcript instead.
	 * @param {string} key
	 * @returns {Promise<import('stream').Readable>}
	 */
	async getStream(key) {
		const full = this.resolve(key);
		const stat = await this.stat(key);
		if (!stat) throw new StorageError('NOT_FOUND', `no object at ${key}`);
		return createReadStream(full);
	}

	/**
	 * @param {string} key
	 * @returns {Promise<{modifiedAt: Date, size: number}|null>} null when absent
	 */
	async stat(key) {
		const full = this.resolve(key);
		try {
			const stats = await fs.stat(full);
			if (!stats.isFile()) return null;
			return {
				modifiedAt: stats.mtime,
				size: stats.size,
			};
		} catch (error) {
			if (error.code === 'ENOENT') return null;
			throw new StorageError('UNAVAILABLE', `could not stat ${key}: ${error.message}`, { cause: error });
		}
	}

	/**
	 * @param {string} key
	 * @returns {Promise<boolean>} false when there was nothing to delete
	 */
	async delete(key) {
		const full = this.resolve(key);
		try {
			await fs.unlink(full);
			return true;
		} catch (error) {
			if (error.code === 'ENOENT') return false;
			throw new StorageError('UNAVAILABLE', `could not delete ${key}: ${error.message}`, { cause: error });
		}
	}

	/**
	 * @param {string} prefix
	 * @returns {AsyncIterable<string>} keys, not paths
	 */
	async *list(prefix = '') {
		const dir = path.join(this.root, 'transcripts');
		let entries;
		try {
			entries = await fs.readdir(dir);
		} catch (error) {
			if (error.code === 'ENOENT') return;
			throw new StorageError('UNAVAILABLE', `could not list ${dir}: ${error.message}`, { cause: error });
		}
		for (const entry of entries) {
			const key = `transcripts/${entry}`;
			if (key.startsWith(prefix)) yield key;
		}
	}
}

module.exports = {
	LocalStorage,
	// Exported for `scripts/check-storage.js`.
	confine,
};
