/**
 * Working hours.
 *
 * `Guild.workingHours` is an 8-element array: a timezone, then one `[open,
 * close]` pair per weekday starting at Sunday, matching `spacetime`'s `day()`.
 * A pair whose two values are equal means "closed that day".
 *
 * This was inline in `TicketManager#postQuestions`, where it did two things at
 * once: decide whether staff are around, and post the "we'll be back at…"
 * notice. Only the first half is reusable, so that is what lives here — the
 * automations `condition.time.workingHours` clause and the opening-message
 * notice now agree by construction rather than by coincidence.
 */

const spacetime = require('spacetime');

/**
 * Where the guild is in its working week right now.
 *
 * @param {*} rawWorkingHours the `Guild.workingHours` column
 * @returns {{working: boolean, nextOpenAt: number|null, when: 'today'|'next'|null}}
 * `nextOpenAt` is a Unix timestamp in **seconds** (what Discord's `<t:...>`
 * markup wants), or null when staff are working or the guild has no working days
 * at all. `when` says which of the two "we're closed" messages applies: staff
 * have not started *today*, or the *next* working day is another day.
 */
function getWorkingHours(rawWorkingHours) {
	// Cloned: the source is a cached Prisma row shared with every other reader,
	// and the shift() below would otherwise eat the timezone permanently.
	const workingHours = Array.isArray(rawWorkingHours)
		? [...rawWorkingHours]
		: JSON.parse(JSON.stringify(rawWorkingHours));
	const timezone = workingHours.shift();

	const now = spacetime.now(timezone);
	const today = workingHours[now.day()];
	if (!today) {
		return {
			nextOpenAt: null,
			when: null,
			working: true,
		};
	}

	const start = now.time(today[0]);
	const end = now.time(today[1]);

	// Day off, or already finished for the day: find the next working day.
	if (today[0] === today[1] || now.isAfter(end)) {
		let nextIndex = workingHours.findIndex((hours, i) => i > now.day() && hours[0] !== hours[1]);
		// Nothing left this week — wrap into next week, today included.
		if (nextIndex === -1) nextIndex = workingHours.findIndex((hours, i) => i <= now.day() && hours[0] !== hours[1]);
		// Every day is a day off: there is no "next", so treat it as always open
		// rather than telling someone to come back never.
		if (nextIndex === -1) {
			return {
				nextOpenAt: null,
				when: null,
				working: true,
			};
		}

		let then = now.add(nextIndex - now.day(), 'day');
		if (nextIndex <= now.day()) then = then.add(1, 'week');
		return {
			nextOpenAt: Math.ceil(then.time(workingHours[nextIndex][0]).goto('utc').d.getTime() / 1000),
			when: 'next',
			working: false,
		};
	}

	// Not started yet today.
	if (now.isBefore(start)) {
		return {
			nextOpenAt: Math.ceil(start.goto('utc').d.getTime() / 1000),
			when: 'today',
			working: false,
		};
	}

	return {
		nextOpenAt: null,
		when: null,
		working: true,
	};
}

module.exports = { getWorkingHours };
