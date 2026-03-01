
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/(default)" | "/" | "/(default)/invite" | "/(default)/login" | "/settings" | "/settings/[guild]" | "/settings/[guild]/categories" | "/settings/[guild]/categories/[category]" | "/settings/[guild]/customization" | "/settings/[guild]/feedback" | "/settings/[guild]/general" | "/settings/[guild]/panels" | "/settings/[guild]/tags" | "/settings/[guild]/transcripts" | "/(default)/view" | "/(default)/view/[ticket]" | "/(default)/[guild]" | "/(default)/[guild]/feedback" | "/(default)/[guild]/staff" | "/(default)/[guild]/tickets";
		RouteParams(): {
			"/settings/[guild]": { guild: string };
			"/settings/[guild]/categories": { guild: string };
			"/settings/[guild]/categories/[category]": { guild: string; category: string };
			"/settings/[guild]/customization": { guild: string };
			"/settings/[guild]/feedback": { guild: string };
			"/settings/[guild]/general": { guild: string };
			"/settings/[guild]/panels": { guild: string };
			"/settings/[guild]/tags": { guild: string };
			"/settings/[guild]/transcripts": { guild: string };
			"/(default)/view/[ticket]": { ticket: string };
			"/(default)/[guild]": { guild: string };
			"/(default)/[guild]/feedback": { guild: string };
			"/(default)/[guild]/staff": { guild: string };
			"/(default)/[guild]/tickets": { guild: string }
		};
		LayoutParams(): {
			"/(default)": { ticket?: string; guild?: string };
			"/": { guild?: string; category?: string; ticket?: string };
			"/(default)/invite": Record<string, never>;
			"/(default)/login": Record<string, never>;
			"/settings": { guild?: string; category?: string };
			"/settings/[guild]": { guild: string; category?: string };
			"/settings/[guild]/categories": { guild: string; category?: string };
			"/settings/[guild]/categories/[category]": { guild: string; category: string };
			"/settings/[guild]/customization": { guild: string };
			"/settings/[guild]/feedback": { guild: string };
			"/settings/[guild]/general": { guild: string };
			"/settings/[guild]/panels": { guild: string };
			"/settings/[guild]/tags": { guild: string };
			"/settings/[guild]/transcripts": { guild: string };
			"/(default)/view": { ticket?: string };
			"/(default)/view/[ticket]": { ticket: string };
			"/(default)/[guild]": { guild: string };
			"/(default)/[guild]/feedback": { guild: string };
			"/(default)/[guild]/staff": { guild: string };
			"/(default)/[guild]/tickets": { guild: string }
		};
		Pathname(): "/" | "/invite" | "/login" | "/settings" | `/settings/${string}` & {} | `/settings/${string}/categories` & {} | `/settings/${string}/categories/${string}` & {} | `/settings/${string}/customization` & {} | `/settings/${string}/feedback` & {} | `/settings/${string}/general` & {} | `/settings/${string}/panels` & {} | `/settings/${string}/tags` & {} | `/settings/${string}/transcripts` & {} | `/view/${string}` & {} | `/${string}` & {} | `/${string}/feedback` & {} | `/${string}/staff` & {} | `/${string}/tickets` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/assets/wordmark-light.png" | string & {};
	}
}