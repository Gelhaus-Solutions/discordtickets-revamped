
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const SUDO_GID: string;
	export const GITHUB_TOKEN: string;
	export const GITHUB_STATE: string;
	export const COPILOT_AGENT_ACTION: string;
	export const SECRET_SCANNING_URL: string;
	export const COPILOT_AGENT_START_TIME_SEC: string;
	export const CURL_CA_BUNDLE: string;
	export const DOTNET_NOLOGO: string;
	export const MAIL: string;
	export const NODE_EXTRA_CA_CERTS: string;
	export const USER: string;
	export const npm_config_user_agent: string;
	export const SHOULD_CONTINUE: string;
	export const CI: string;
	export const XDG_SESSION_TYPE: string;
	export const USE_BAZEL_FALLBACK_VERSION: string;
	export const RUNNER_ENVIRONMENT: string;
	export const GITHUB_ENV: string;
	export const COPILOT_AGENT_ONLINE_EVALUATION_DISABLED: string;
	export const PIPX_HOME: string;
	export const npm_node_execpath: string;
	export const JAVA_HOME_8_X64: string;
	export const SHLVL: string;
	export const npm_config_noproxy: string;
	export const COPILOT_AGENT_RUNTIME_VERSION: string;
	export const HOME: string;
	export const OLDPWD: string;
	export const RUNNER_TEMP: string;
	export const GITHUB_EVENT_PATH: string;
	export const CAROOT: string;
	export const COPILOT_AGENT_FIREWALL_RULESET_ALLOW_LIST: string;
	export const npm_package_json: string;
	export const JAVA_HOME_11_X64: string;
	export const COPILOT_AGENT_MCP_SERVER_TEMP: string;
	export const PIPX_BIN_DIR: string;
	export const GITHUB_REPOSITORY_OWNER: string;
	export const GRADLE_HOME: string;
	export const ANDROID_NDK_LATEST_HOME: string;
	export const JAVA_HOME_21_X64: string;
	export const GITHUB_RETENTION_DAYS: string;
	export const GITHUB_REPOSITORY_OWNER_ID: string;
	export const POWERSHELL_DISTRIBUTION_CHANNEL: string;
	export const SSL_CERT_FILE: string;
	export const AZURE_EXTENSION_DIR: string;
	export const GITHUB_HEAD_REF: string;
	export const npm_config_userconfig: string;
	export const npm_config_local_prefix: string;
	export const SYSTEMD_EXEC_PID: string;
	export const ACTIONS_ORCHESTRATION_ID: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const GITHUB_GRAPHQL_URL: string;
	export const GITHUB_DOWNLOADS_URL: string;
	export const COLOR: string;
	export const JAVA_HOME_25_X64: string;
	export const NVM_DIR: string;
	export const DOTNET_SKIP_FIRST_TIME_EXPERIENCE: string;
	export const COPILOT_JOB_EVENT_TYPE: string;
	export const JAVA_HOME_17_X64: string;
	export const ImageVersion: string;
	export const SUDO_UID: string;
	export const BLACKBIRD_MODE: string;
	export const LOGNAME: string;
	export const COPILOT_AGENT_PR_COMMIT_COUNT: string;
	export const RUNNER_OS: string;
	export const GITHUB_API_URL: string;
	export const GOROOT_1_22_X64: string;
	export const COPILOT_AGENT_COMMIT_LOGIN: string;
	export const SWIFT_PATH: string;
	export const COPILOT_USE_SESSIONS: string;
	export const CHROMEWEBDRIVER: string;
	export const COPILOT_AGENT_CONTENT_FILTER_MODE: string;
	export const GOROOT_1_23_X64: string;
	export const JOURNAL_STREAM: string;
	export const GITHUB_WORKFLOW: string;
	export const _: string;
	export const npm_config_prefix: string;
	export const npm_config_npm_version: string;
	export const COPILOT_AGENT_BRANCH_NAME: string;
	export const MEMORY_PRESSURE_WATCH: string;
	export const XDG_SESSION_CLASS: string;
	export const GOROOT_1_24_X64: string;
	export const ACTIONS_RUNNER_ACTION_ARCHIVE_CACHE: string;
	export const COPILOT_AGENT_FIREWALL_ENABLE_RULESET_ALLOW_LIST: string;
	export const GOROOT_1_25_X64: string;
	export const GITHUB_RUN_ID: string;
	export const TERM: string;
	export const XDG_SESSION_ID: string;
	export const npm_config_cache: string;
	export const COPILOT_AGENT_TIMING_SECTIONS: string;
	export const GITHUB_REF_TYPE: string;
	export const BOOTSTRAP_HASKELL_NONINTERACTIVE: string;
	export const GITHUB_WORKFLOW_SHA: string;
	export const GITHUB_BASE_REF: string;
	export const ImageOS: string;
	export const COPILOT_MCP_ENABLED: string;
	export const COPILOT_AGENT_CALLBACK_URL: string;
	export const GITHUB_WORKFLOW_REF: string;
	export const GITHUB_ACTION_REPOSITORY: string;
	export const ENABLE_RUNNER_TRACING: string;
	export const npm_config_node_gyp: string;
	export const PATH: string;
	export const COPILOT_AGENT_INJECTED_SECRET_NAMES: string;
	export const ANT_HOME: string;
	export const DOTNET_MULTILEVEL_LOOKUP: string;
	export const RUNNER_TRACKING_ID: string;
	export const INVOCATION_ID: string;
	export const RUNNER_TOOL_CACHE: string;
	export const GITHUB_UPLOADS_URL: string;
	export const REQUESTS_CA_BUNDLE: string;
	export const NODE: string;
	export const npm_package_name: string;
	export const GITHUB_ACTION: string;
	export const GITHUB_RUN_NUMBER: string;
	export const GITHUB_TRIGGERING_ACTOR: string;
	export const COPILOT_EXPERIMENTS: string;
	export const RUNNER_ARCH: string;
	export const XDG_RUNTIME_DIR: string;
	export const AGENT_TOOLSDIRECTORY: string;
	export const SSL_CERT_DIR: string;
	export const LANG: string;
	export const VCPKG_INSTALLATION_ROOT: string;
	export const CONDA: string;
	export const RUNNER_NAME: string;
	export const XDG_CONFIG_HOME: string;
	export const COPILOT_USE_ASYNC_SESSIONS: string;
	export const GITHUB_REF_NAME: string;
	export const GITHUB_REPOSITORY: string;
	export const npm_lifecycle_script: string;
	export const SUDO_COMMAND: string;
	export const ANDROID_NDK_ROOT: string;
	export const GITHUB_ACTION_REF: string;
	export const DEBIAN_FRONTEND: string;
	export const SHELL: string;
	export const GITHUB_REPOSITORY_ID: string;
	export const GITHUB_ACTIONS: string;
	export const CPD_SAVE_TRAJECTORY_OUTPUT: string;
	export const npm_package_version: string;
	export const npm_lifecycle_event: string;
	export const GITHUB_REF_PROTECTED: string;
	export const GITHUB_WORKSPACE: string;
	export const SUDO_USER: string;
	export const ACCEPT_EULA: string;
	export const DOTNET_SYSTEM_NET_DISABLEIPV6: string;
	export const GITHUB_JOB: string;
	export const GITHUB_SHA: string;
	export const GITHUB_RUN_ATTEMPT: string;
	export const COPILOT_AGENT_DEBUG: string;
	export const GITHUB_REF: string;
	export const COPILOT_AGENT_ISSUE_NUMBER: string;
	export const COPILOT_AGENT_SOURCE_ENVIRONMENT: string;
	export const GITHUB_ACTOR: string;
	export const FIREWALL_RULESET_CONTENT: string;
	export const ANDROID_SDK_ROOT: string;
	export const npm_config_globalconfig: string;
	export const npm_config_init_module: string;
	export const GITHUB_PATH: string;
	export const JAVA_HOME: string;
	export const PWD: string;
	export const GITHUB_ACTOR_ID: string;
	export const RUNNER_WORKSPACE: string;
	export const npm_execpath: string;
	export const COPILOT_AGENT_PR_NUMBER: string;
	export const HOMEBREW_CLEANUP_PERIODIC_FULL_DAYS: string;
	export const GITHUB_EVENT_NAME: string;
	export const HOMEBREW_NO_AUTO_UPDATE: string;
	export const ANDROID_HOME: string;
	export const GITHUB_SERVER_URL: string;
	export const GECKOWEBDRIVER: string;
	export const GHCUP_INSTALL_BASE_PREFIX: string;
	export const GITHUB_OUTPUT: string;
	export const npm_config_global_prefix: string;
	export const EDGEWEBDRIVER: string;
	export const COPILOT_EXPERIMENT_ASSIGNMENT_CONTEXT: string;
	export const npm_command: string;
	export const ANDROID_NDK: string;
	export const SGX_AESM_ADDR: string;
	export const PSModulePath: string;
	export const CHROME_BIN: string;
	export const SELENIUM_JAR_PATH: string;
	export const MEMORY_PRESSURE_WRITE: string;
	export const COPILOT_AGENT_COMMIT_EMAIL: string;
	export const COPILOT_AGENT_FIREWALL_LOG_FILE: string;
	export const COPILOT_FEATURE_FLAGS: string;
	export const ANDROID_NDK_HOME: string;
	export const GITHUB_STEP_SUMMARY: string;
	export const COPILOT_AGENT_BASE_COMMIT: string;
	export const COPILOT_AGENT_TIMEOUT_MIN: string;
	export const INIT_CWD: string;
	export const EDITOR: string;
	export const NODE_ENV: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		SUDO_GID: string;
		GITHUB_TOKEN: string;
		GITHUB_STATE: string;
		COPILOT_AGENT_ACTION: string;
		SECRET_SCANNING_URL: string;
		COPILOT_AGENT_START_TIME_SEC: string;
		CURL_CA_BUNDLE: string;
		DOTNET_NOLOGO: string;
		MAIL: string;
		NODE_EXTRA_CA_CERTS: string;
		USER: string;
		npm_config_user_agent: string;
		SHOULD_CONTINUE: string;
		CI: string;
		XDG_SESSION_TYPE: string;
		USE_BAZEL_FALLBACK_VERSION: string;
		RUNNER_ENVIRONMENT: string;
		GITHUB_ENV: string;
		COPILOT_AGENT_ONLINE_EVALUATION_DISABLED: string;
		PIPX_HOME: string;
		npm_node_execpath: string;
		JAVA_HOME_8_X64: string;
		SHLVL: string;
		npm_config_noproxy: string;
		COPILOT_AGENT_RUNTIME_VERSION: string;
		HOME: string;
		OLDPWD: string;
		RUNNER_TEMP: string;
		GITHUB_EVENT_PATH: string;
		CAROOT: string;
		COPILOT_AGENT_FIREWALL_RULESET_ALLOW_LIST: string;
		npm_package_json: string;
		JAVA_HOME_11_X64: string;
		COPILOT_AGENT_MCP_SERVER_TEMP: string;
		PIPX_BIN_DIR: string;
		GITHUB_REPOSITORY_OWNER: string;
		GRADLE_HOME: string;
		ANDROID_NDK_LATEST_HOME: string;
		JAVA_HOME_21_X64: string;
		GITHUB_RETENTION_DAYS: string;
		GITHUB_REPOSITORY_OWNER_ID: string;
		POWERSHELL_DISTRIBUTION_CHANNEL: string;
		SSL_CERT_FILE: string;
		AZURE_EXTENSION_DIR: string;
		GITHUB_HEAD_REF: string;
		npm_config_userconfig: string;
		npm_config_local_prefix: string;
		SYSTEMD_EXEC_PID: string;
		ACTIONS_ORCHESTRATION_ID: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		GITHUB_GRAPHQL_URL: string;
		GITHUB_DOWNLOADS_URL: string;
		COLOR: string;
		JAVA_HOME_25_X64: string;
		NVM_DIR: string;
		DOTNET_SKIP_FIRST_TIME_EXPERIENCE: string;
		COPILOT_JOB_EVENT_TYPE: string;
		JAVA_HOME_17_X64: string;
		ImageVersion: string;
		SUDO_UID: string;
		BLACKBIRD_MODE: string;
		LOGNAME: string;
		COPILOT_AGENT_PR_COMMIT_COUNT: string;
		RUNNER_OS: string;
		GITHUB_API_URL: string;
		GOROOT_1_22_X64: string;
		COPILOT_AGENT_COMMIT_LOGIN: string;
		SWIFT_PATH: string;
		COPILOT_USE_SESSIONS: string;
		CHROMEWEBDRIVER: string;
		COPILOT_AGENT_CONTENT_FILTER_MODE: string;
		GOROOT_1_23_X64: string;
		JOURNAL_STREAM: string;
		GITHUB_WORKFLOW: string;
		_: string;
		npm_config_prefix: string;
		npm_config_npm_version: string;
		COPILOT_AGENT_BRANCH_NAME: string;
		MEMORY_PRESSURE_WATCH: string;
		XDG_SESSION_CLASS: string;
		GOROOT_1_24_X64: string;
		ACTIONS_RUNNER_ACTION_ARCHIVE_CACHE: string;
		COPILOT_AGENT_FIREWALL_ENABLE_RULESET_ALLOW_LIST: string;
		GOROOT_1_25_X64: string;
		GITHUB_RUN_ID: string;
		TERM: string;
		XDG_SESSION_ID: string;
		npm_config_cache: string;
		COPILOT_AGENT_TIMING_SECTIONS: string;
		GITHUB_REF_TYPE: string;
		BOOTSTRAP_HASKELL_NONINTERACTIVE: string;
		GITHUB_WORKFLOW_SHA: string;
		GITHUB_BASE_REF: string;
		ImageOS: string;
		COPILOT_MCP_ENABLED: string;
		COPILOT_AGENT_CALLBACK_URL: string;
		GITHUB_WORKFLOW_REF: string;
		GITHUB_ACTION_REPOSITORY: string;
		ENABLE_RUNNER_TRACING: string;
		npm_config_node_gyp: string;
		PATH: string;
		COPILOT_AGENT_INJECTED_SECRET_NAMES: string;
		ANT_HOME: string;
		DOTNET_MULTILEVEL_LOOKUP: string;
		RUNNER_TRACKING_ID: string;
		INVOCATION_ID: string;
		RUNNER_TOOL_CACHE: string;
		GITHUB_UPLOADS_URL: string;
		REQUESTS_CA_BUNDLE: string;
		NODE: string;
		npm_package_name: string;
		GITHUB_ACTION: string;
		GITHUB_RUN_NUMBER: string;
		GITHUB_TRIGGERING_ACTOR: string;
		COPILOT_EXPERIMENTS: string;
		RUNNER_ARCH: string;
		XDG_RUNTIME_DIR: string;
		AGENT_TOOLSDIRECTORY: string;
		SSL_CERT_DIR: string;
		LANG: string;
		VCPKG_INSTALLATION_ROOT: string;
		CONDA: string;
		RUNNER_NAME: string;
		XDG_CONFIG_HOME: string;
		COPILOT_USE_ASYNC_SESSIONS: string;
		GITHUB_REF_NAME: string;
		GITHUB_REPOSITORY: string;
		npm_lifecycle_script: string;
		SUDO_COMMAND: string;
		ANDROID_NDK_ROOT: string;
		GITHUB_ACTION_REF: string;
		DEBIAN_FRONTEND: string;
		SHELL: string;
		GITHUB_REPOSITORY_ID: string;
		GITHUB_ACTIONS: string;
		CPD_SAVE_TRAJECTORY_OUTPUT: string;
		npm_package_version: string;
		npm_lifecycle_event: string;
		GITHUB_REF_PROTECTED: string;
		GITHUB_WORKSPACE: string;
		SUDO_USER: string;
		ACCEPT_EULA: string;
		DOTNET_SYSTEM_NET_DISABLEIPV6: string;
		GITHUB_JOB: string;
		GITHUB_SHA: string;
		GITHUB_RUN_ATTEMPT: string;
		COPILOT_AGENT_DEBUG: string;
		GITHUB_REF: string;
		COPILOT_AGENT_ISSUE_NUMBER: string;
		COPILOT_AGENT_SOURCE_ENVIRONMENT: string;
		GITHUB_ACTOR: string;
		FIREWALL_RULESET_CONTENT: string;
		ANDROID_SDK_ROOT: string;
		npm_config_globalconfig: string;
		npm_config_init_module: string;
		GITHUB_PATH: string;
		JAVA_HOME: string;
		PWD: string;
		GITHUB_ACTOR_ID: string;
		RUNNER_WORKSPACE: string;
		npm_execpath: string;
		COPILOT_AGENT_PR_NUMBER: string;
		HOMEBREW_CLEANUP_PERIODIC_FULL_DAYS: string;
		GITHUB_EVENT_NAME: string;
		HOMEBREW_NO_AUTO_UPDATE: string;
		ANDROID_HOME: string;
		GITHUB_SERVER_URL: string;
		GECKOWEBDRIVER: string;
		GHCUP_INSTALL_BASE_PREFIX: string;
		GITHUB_OUTPUT: string;
		npm_config_global_prefix: string;
		EDGEWEBDRIVER: string;
		COPILOT_EXPERIMENT_ASSIGNMENT_CONTEXT: string;
		npm_command: string;
		ANDROID_NDK: string;
		SGX_AESM_ADDR: string;
		PSModulePath: string;
		CHROME_BIN: string;
		SELENIUM_JAR_PATH: string;
		MEMORY_PRESSURE_WRITE: string;
		COPILOT_AGENT_COMMIT_EMAIL: string;
		COPILOT_AGENT_FIREWALL_LOG_FILE: string;
		COPILOT_FEATURE_FLAGS: string;
		ANDROID_NDK_HOME: string;
		GITHUB_STEP_SUMMARY: string;
		COPILOT_AGENT_BASE_COMMIT: string;
		COPILOT_AGENT_TIMEOUT_MIN: string;
		INIT_CWD: string;
		EDITOR: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
