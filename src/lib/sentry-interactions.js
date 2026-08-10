const Sentry = require('@sentry/node');
const { recordInteraction } = require('./metrics');

/**
 * Wrap every interaction handler in a Sentry span.
 *
 * dbf dispatches with `component.run(...)` inside its own try/catch and emits
 * `run` before it and `success` after, with nothing that brackets the call — so
 * there is no event pair a span can straddle. Wrapping the component's own `run`
 * is the one seam that covers the whole execution, including the failure path.
 *
 * The interaction is the last argument in every module's signature:
 *   command.run(interaction)            menu.run(json, interaction)
 *   button.run(json, interaction)       modal.run(json, interaction)
 *
 * `autocomplete` is deliberately left alone. It fires per keystroke, so tracing
 * it would swamp every other transaction; its failures are still reported,
 * because those go through `handleInteractionError` like everything else.
 */
const MODULES = ['buttons', 'commands', 'menus', 'modals'];

/** Human label for a component, per module. */
const describe = (component, moduleName) => {
	const name = component.name ?? component.id ?? 'unknown';
	return moduleName === 'commands' ? `/${name}` : `${moduleName.slice(0, -1)} ${name}`;
};

/**
 * @param {Object} component a dbf FrameworkComponent
 * @param {string} moduleName the module it belongs to
 * @returns {void}
 */
const instrument = (component, moduleName) => {
	if (typeof component?.run !== 'function' || component.sentryWrapped) return;

	const original = component.run;
	const label = describe(component, moduleName);

	component.run = function (...args) {
		const interaction = args[args.length - 1];
		if (typeof interaction?.isCommand !== 'function') return original.apply(this, args);

		// An isolation scope per interaction: without it, tags set by one
		// interaction would leak into any other running concurrently, and this
		// bot handles plenty at once.
		return Sentry.withIsolationScope(scope => {
			scope.setTag('interaction.type', moduleName);
			if (interaction.guildId) scope.setTag('guild', interaction.guildId);
			// Discord user ids identify the operator's members, not the
			// operator, so they follow the same opt-in as every other PII.
			if (Sentry.getClient()?.getOptions()?.sendDefaultPii) {
				scope.setUser({ id: interaction.user?.id });
			}

			const startedAt = Date.now();
			// The metric records both outcomes, so failures show up as a rate
			// rather than only as an absence of successes.
			let outcome = 'ok';

			return Sentry.startSpan({
				attributes: {
					'discord.channel_id': interaction.channelId ?? undefined,
					'discord.guild_id': interaction.guildId ?? undefined,
					'discord.locale': interaction.locale ?? undefined,
				},
				forceTransaction: true,
				name: label,
				op: 'discord.interaction',
			}, () => {
				let settled;
				try {
					settled = original.apply(this, args);
				} catch (error) {
					// A handler that throws synchronously never reaches the
					// promise path below.
					outcome = 'error';
					recordInteraction(moduleName, component.name ?? component.id, outcome, Date.now() - startedAt);
					throw error;
				}
				return Promise.resolve(settled)
					.catch(error => {
						outcome = 'error';
						throw error;
					})
					.finally(() => recordInteraction(
						moduleName,
						component.name ?? component.id,
						outcome,
						Date.now() - startedAt,
					));
			});
		});
	};

	component.sentryWrapped = true;
};

/**
 * Stop a rejecting event listener from becoming an unhandled rejection.
 *
 * dbf binds listeners with `listener._run = (...args) => listener.run(...args)`
 * straight onto the emitter, and an EventEmitter does not await anything. So an
 * `async run()` that rejects — and most of them are async and touch the
 * database — produced an unhandled rejection with no context saying which
 * listener it came from. Discord events fire constantly, so one broken listener
 * meant a steady stream of them.
 *
 * Applied whether or not Sentry is configured: turning a silent process-level
 * rejection into an attributed log line is worth having on its own.
 *
 * @param {import('../client')} client
 * @returns {void}
 */
module.exports.guardListeners = client => {
	const wrap = listener => {
		if (typeof listener?.run !== 'function' || listener.runGuarded) return;
		const original = listener.run;
		const event = listener.event ?? listener.id ?? 'unknown';

		const report = error => {
			client.log.error.listeners(`"${event}" listener error:`, error);
			try {
				Sentry.withScope(scope => {
					scope.setTag('listener.event', event);
					Sentry.captureException(error);
				});
			} catch { /* reporting must not itself throw here */ }
		};

		listener.run = function (...args) {
			let settled;
			try {
				settled = original.apply(this, args);
			} catch (error) {
				report(error);
				return undefined;
			}
			// Nothing consumes a listener's return value, so swallowing after
			// reporting is safe — and is the whole point.
			return Promise.resolve(settled).catch(report);
		};

		listener.runGuarded = true;
	};

	const mod = client.events;
	if (!mod) return;
	for (const listener of mod.components.values()) wrap(listener);
	mod.on('componentLoad', wrap);
};

/**
 * @param {import('../client')} client
 * @returns {void}
 */
module.exports.instrumentInteractions = client => {
	for (const moduleName of MODULES) {
		const mod = client[moduleName];
		if (!mod) continue;

		// Components loaded during `super()` are already in place by the time
		// this runs, so they are wrapped directly...
		for (const component of mod.components.values()) instrument(component, moduleName);

		// ...while `componentLoad` covers the ones that arrive later. The
		// `reload` stdin command re-imports a component and replaces the entry
		// in this collection, which would otherwise quietly drop it out of
		// tracing until the next restart.
		mod.on('componentLoad', component => instrument(component, moduleName));
	}
};
