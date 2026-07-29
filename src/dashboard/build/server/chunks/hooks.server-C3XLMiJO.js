function reroute({ url }) {
  const pathMatch = url.pathname.match(/^\/(\d+)(\/.*)?$/);
  if (pathMatch && !url.pathname.startsWith("/settings/")) {
    const guildId = pathMatch[1];
    const rest = pathMatch[2] || "";
    return `/settings/${guildId}${rest}`;
  }
}
async function handle({ event, resolve }) {
  const response = await resolve(event, {
    filterSerializedResponseHeaders: () => true
  });
  return response;
}
const INTERNAL_PREFIXES = ["/api/", "/auth/", "/attachments/", "/avatars/", "/transcript/"];
function internalOrigin() {
  if (process.env.HTTP_INTERNAL) return process.env.HTTP_INTERNAL.replace(/\/$/, "");
  const port = process.env.HTTP_PORT;
  if (!port) return null;
  let host = process.env.HTTP_HOST || "127.0.0.1";
  if (host === "0.0.0.0" || host === "::" || host === "*" || host === "") host = "127.0.0.1";
  if (host.includes(":")) host = `[${host}]`;
  return `http://${host}:${port}`;
}
async function handleFetch({ event, request, fetch }) {
  const url = new URL(request.url);
  const isSameOrigin = url.origin === event.url.origin;
  const isInternalPath = INTERNAL_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
  if (!isSameOrigin || !isInternalPath) return fetch(request);
  const origin = internalOrigin();
  if (!origin) return fetch(request);
  const headers = new Headers(request.headers);
  const cookie = event.request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  headers.set("x-forwarded-host", event.url.host);
  headers.set("x-forwarded-proto", event.url.protocol.replace(":", ""));
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const rewritten = new Request(origin + url.pathname + url.search, {
    body: hasBody ? request.body : void 0,
    duplex: "half",
    // required by undici whenever a body stream is passed
    headers,
    method: request.method,
    signal: request.signal
  });
  return fetch(rewritten);
}
function handleError({ error, event }) {
  const errorId = Date.now().toString(16);
  if (process?.env.NODE_ENV === "development") console.error(error);
  process?.emit("sveltekit:error", {
    error,
    errorId,
    event
  });
  return {
    name: "Internal Server Error",
    message: error.message,
    errorId
  };
}

export { handle, handleError, handleFetch, reroute };
//# sourceMappingURL=hooks.server-C3XLMiJO.js.map
