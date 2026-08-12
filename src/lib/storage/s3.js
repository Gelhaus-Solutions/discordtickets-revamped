const {
	StorageError, assertKey,
} = require('./keys');

/**
 * Transcripts in S3-compatible object storage.
 *
 * Opt-in. Almost every install is better served by the local driver — this is
 * for deployments where the data directory is not durable, or where transcripts
 * have outgrown the disk they are on.
 *
 * Note what this driver deliberately does NOT do: hand out presigned URLs. The
 * transcript route serves HTML built from user-authored Discord messages under
 * a strict per-response CSP, and re-checks the admin session on every view. A
 * presigned URL is a bearer credential in a query string — it survives in
 * browser history and proxy logs, is trivially forwardable to someone with no
 * dashboard access, and arrives from an origin whose headers we do not control.
 * So objects are streamed through the route instead, and the bot pays the
 * egress. If presigning is ever wanted it belongs behind its own setting, with
 * that trade-off written down next to it.
 */
class S3Storage {
	/**
	 * @param {object} options
	 * @param {object} options.settings the `storage.s3` config block
	 * @param {object} [options.log]
	 */
	constructor({
		log = console, settings = {},
	}) {
		this.name = 's3';
		this.log = log;

		// Environment wins over the config file, so panel and Docker operators can
		// configure this without editing a file inside the volume.
		const env = process.env;
		this.bucket = env.S3_BUCKET || settings.bucket || '';
		this.prefix = env.S3_PREFIX ?? settings.prefix ?? '';
		const endpoint = env.S3_ENDPOINT || settings.endpoint || '';
		const region = env.S3_REGION || settings.region || 'us-east-1';
		const forcePathStyle = env.S3_FORCE_PATH_STYLE
			? env.S3_FORCE_PATH_STYLE === 'true'
			: settings.forcePathStyle !== false;

		if (!this.bucket) {
			throw new StorageError('MISCONFIGURED', 'S3 storage is enabled but no bucket is set (storage.s3.bucket, or S3_BUCKET)');
		}
		if (this.prefix && (this.prefix.startsWith('/') || this.prefix.includes('..') || this.prefix.includes('\\'))) {
			throw new StorageError('MISCONFIGURED', `invalid storage.s3.prefix: ${this.prefix}`);
		}
		if (this.prefix && !this.prefix.endsWith('/')) this.prefix += '/';

		// Required here rather than at the top of the file: this is an optional
		// dependency, and an install that never enables S3 must not need it.
		let sdk;
		try {
			sdk = require('@aws-sdk/client-s3');
		} catch (error) {
			throw new StorageError(
				'MISCONFIGURED',
				'S3 storage is enabled but @aws-sdk/client-s3 is not installed. Run: npm install @aws-sdk/client-s3',
				{ cause: error },
			);
		}
		this.sdk = sdk;

		// No `credentials` when the keys are absent, so the SDK's own provider
		// chain runs — that is what makes instance roles (IMDS, IRSA) work, and it
		// is the posture to prefer in production.
		const credentials = env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
			? {
				accessKeyId: env.S3_ACCESS_KEY_ID,
				secretAccessKey: env.S3_SECRET_ACCESS_KEY,
				...(env.S3_SESSION_TOKEN ? { sessionToken: env.S3_SESSION_TOKEN } : {}),
			}
			: undefined;

		this.client = new sdk.S3Client({
			forcePathStyle,
			// Three attempts, then give up: a transcript read falls back to
			// regenerating from the database, and a transcript write is retried by
			// Temporal. Neither wants the SDK retrying for minutes first.
			maxAttempts: 3,
			region,
			...(credentials ? { credentials } : {}),
			...(endpoint ? { endpoint } : {}),
		});
	}

	/**
	 * @param {string} key
	 * @returns {string} the object key, with the configured prefix applied once
	 */
	object(key) {
		assertKey(key);
		return this.prefix + key;
	}

	/**
	 * Confirm the bucket is reachable. Called at boot and never fatal — an
	 * operator should learn their credentials are wrong then, not at the first
	 * ticket close, but a transient outage must not stop the bot starting.
	 * @returns {Promise<boolean>}
	 */
	async check() {
		try {
			await this.client.send(new this.sdk.HeadBucketCommand({ Bucket: this.bucket }));
			this.log.info('Transcript storage: S3 bucket "%s" is reachable', this.bucket);
			return true;
		} catch (error) {
			this.log.warn('Transcript storage: S3 bucket "%s" is not reachable: %s', this.bucket, error.message);
			return false;
		}
	}

	/**
	 * @param {Error} error
	 * @param {string} key
	 * @returns {StorageError}
	 */
	wrap(error, key) {
		const status = error?.$metadata?.httpStatusCode;
		if (error?.name === 'NotFound' || error?.name === 'NoSuchKey' || status === 404) {
			return new StorageError('NOT_FOUND', `no object at ${key}`, { cause: error });
		}
		if (status === 401 || status === 403) {
			return new StorageError('DENIED', `not allowed to access ${key}`, { cause: error });
		}
		return new StorageError('UNAVAILABLE', `S3 request for ${key} failed: ${error.message}`, { cause: error });
	}

	/**
	 * @param {string} key
	 * @param {Buffer|string} body
	 * @returns {Promise<{key: string, size: number}>}
	 */
	async put(key, body) {
		const Key = this.object(key);
		try {
			await this.client.send(new this.sdk.PutObjectCommand({
				Body: body,
				Bucket: this.bucket,
				ContentType: 'text/html; charset=utf-8',
				Key,
			}));
		} catch (error) {
			throw this.wrap(error, key);
		}
		return {
			key,
			size: Buffer.byteLength(body),
		};
	}

	/**
	 * @param {string} key
	 * @returns {Promise<Buffer>}
	 */
	async get(key) {
		const stream = await this.getStream(key);
		const chunks = [];
		for await (const chunk of stream) chunks.push(chunk);
		return Buffer.concat(chunks);
	}

	/**
	 * @param {string} key
	 * @returns {Promise<import('stream').Readable>}
	 */
	async getStream(key) {
		const Key = this.object(key);
		try {
			const result = await this.client.send(new this.sdk.GetObjectCommand({
				Bucket: this.bucket,
				Key,
			}));
			return result.Body;
		} catch (error) {
			throw this.wrap(error, key);
		}
	}

	/**
	 * @param {string} key
	 * @returns {Promise<{modifiedAt: Date, size: number}|null>}
	 */
	async stat(key) {
		const Key = this.object(key);
		try {
			const result = await this.client.send(new this.sdk.HeadObjectCommand({
				Bucket: this.bucket,
				Key,
			}));
			return {
				modifiedAt: result.LastModified ?? new Date(0),
				size: result.ContentLength ?? 0,
			};
		} catch (error) {
			const wrapped = this.wrap(error, key);
			if (wrapped.code === 'NOT_FOUND') return null;
			throw wrapped;
		}
	}

	/**
	 * @param {string} key
	 * @returns {Promise<boolean>}
	 */
	async delete(key) {
		const Key = this.object(key);
		// S3 deletes are idempotent and report success for keys that were never
		// there, so this is checked first to keep the driver's contract honest.
		const exists = await this.stat(key);
		if (!exists) return false;
		try {
			await this.client.send(new this.sdk.DeleteObjectCommand({
				Bucket: this.bucket,
				Key,
			}));
			return true;
		} catch (error) {
			throw this.wrap(error, key);
		}
	}

	/**
	 * @param {string} prefix
	 * @returns {AsyncIterable<string>} keys with the bucket prefix stripped back off
	 */
	async *list(prefix = '') {
		let ContinuationToken;
		do {
			let page;
			try {
				page = await this.client.send(new this.sdk.ListObjectsV2Command({
					Bucket: this.bucket,
					ContinuationToken,
					Prefix: this.prefix + prefix,
				}));
			} catch (error) {
				throw this.wrap(error, prefix);
			}
			for (const object of page.Contents ?? []) {
				yield this.prefix ? object.Key.slice(this.prefix.length) : object.Key;
			}
			ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
		} while (ContinuationToken);
	}
}

module.exports = { S3Storage };
