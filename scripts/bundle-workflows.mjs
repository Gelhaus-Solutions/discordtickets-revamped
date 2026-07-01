/**
 * Pre-bundle the workflow code into a single deterministic file the embedded
 * Worker loads at runtime (the bot runs on plain Node and can't load .ts).
 */
import { bundleWorkflowCode } from '@temporalio/worker';
import {
	mkdir, writeFile,
} from 'node:fs/promises';
import {
	dirname, join,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const out = join(root, 'dist', 'temporal', 'workflow-bundle.js');

const { code } = await bundleWorkflowCode({ workflowsPath: join(root, 'src', 'temporal', 'workflows', 'index.ts') });

await mkdir(dirname(out), { recursive: true });
await writeFile(out, code, 'utf8');

// eslint-disable-next-line no-console
console.log(`Workflow bundle written to ${out}`);
