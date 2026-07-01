import { Client } from '@temporalio/client';
import { createClientConnection } from './connection';
import { getTemporalConfig } from './config';

let _client: Client | null = null;

/** Initialise (once) and return the shared Temporal Client. */
export async function initTemporalClient(): Promise<Client> {
	if (_client) return _client;
	const connection = await createClientConnection();
	const { namespace } = getTemporalConfig();
	_client = new Client({
		connection,
		namespace,
	});
	return _client;
}

export function getTemporalClient(): Client {
	if (!_client) throw new Error('Temporal client has not been initialised. Call initTemporalClient() first.');
	return _client;
}

export async function closeTemporalClient(): Promise<void> {
	if (_client) {
		await _client.connection.close();
		_client = null;
	}
}
