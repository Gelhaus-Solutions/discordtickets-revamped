/**
 * The per-member, per-category cooldown, worked out rather than remembered.
 *
 * What is cached against a member is the time they last opened a ticket in the
 * category — never the expiry that time implies. The expiry is derived here, at
 * the moment somebody tries to open another one, against whatever the category's
 * cooldown is *then*.
 *
 * That distinction is the whole file. The cache used to hold the expiry itself,
 * computed at creation, which meant an admin who shortened a category's cooldown
 * went on being turned away with the old wait until the old wait ran out — and
 * nothing could reasonably have invalidated it, since the entries are one per
 * member per category. Deriving instead makes a settings change take effect on
 * the next attempt, which is what anyone editing the field expects.
 *
 * Dependency-free on purpose, so `scripts/check-tickets.js` can exercise it
 * without Discord, Prisma or Temporal.
 */

/** Where a member's last creation time for a category is cached. */
const cooldownKey = (categoryId, memberId) => `cooldowns/category-member-created:${categoryId}-${memberId}`;

/**
 * When this member may next open a ticket here, or null if that is now.
 *
 * @param {?number|Date} createdAt when they last opened one, or null if never
 * @param {?number} cooldown the category's cooldown in ms, 0 or null for none
 * @param {number} [now]
 * @returns {?number} epoch ms, always in the future
 */
function cooldownExpiry(createdAt, cooldown, now = Date.now()) {
	if (!cooldown || !createdAt) return null;
	const at = createdAt instanceof Date ? createdAt.getTime() : Number(createdAt);
	if (!Number.isFinite(at)) return null;
	const expiresAt = at + cooldown;
	return expiresAt > now ? expiresAt : null;
}

module.exports = {
	cooldownExpiry,
	cooldownKey,
};
