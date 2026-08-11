<script>
	import { base } from '$app/paths';
	import cookie from 'cookie';
	import ms from 'ms';
	/** @type {{user: any, isDark: any}} */
	let { user, theme } = $props();

	const toggle = () => {
		document.cookie = cookie.serialize('theme', theme === 'dark' ? 'light' : 'dark', {
			maxAge: ms('1y') / 1000,
			path: '/',
			sameSite: 'lax'
		});
		window.location = window.location; // eslint-disable-line
	};
</script>

<div class="my-8 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
	<div class="grid grid-cols-1 gap-4 sm:mx-8 md:grid-cols-2">
		<div>
			<!--
				The portal root, not the settings picker. This is the closest thing
				the dashboard has to a home button, and it sits on portal pages too —
				where sending someone into the admin panel is the wrong destination
				entirely. `/` picks a server, and goes straight to it when there is
				only one.
			-->
			<a href={base + '/'} class="flex justify-center md:justify-start">
				<span class="text-lg font-bold text-blurple">Discord Tickets</span>
			</a>
		</div>
		<div>
			<div
				class="mx-auto flex w-64 flex-shrink-0 items-center justify-center text-center md:float-right md:mx-0 md:justify-end md:text-left"
			>
				<a
					href={`/auth/logout`}
					class="flex items-center justify-center hover:font-medium md:justify-end"
					title="Logout"
				>
					<img
						src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`}
						class="h-8 rounded-full"
						alt="Discord Tickets"
					/>
					<span class="ml-3">{user.username}</span>
				</a>
				<div class="ml-4">
					<!--
						A real button, not a clickable <i>: this is the only way to change
						the theme, and as a bare icon it could not be reached by keyboard
						or announced by a screen reader at all.
					-->
					<button
						type="button"
						class="cursor-pointer p-1 text-lg transition duration-300 hover:text-blurple"
						title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
						aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
						onclick={() => toggle()}
					>
						<i class="fa-solid {theme === 'dark' ? 'fa-moon' : 'fa-sun'}"></i>
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
