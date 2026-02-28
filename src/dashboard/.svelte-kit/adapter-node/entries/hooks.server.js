async function handle({ event, resolve }) {
  const response = await resolve(event, {
    filterSerializedResponseHeaders: () => true
  });
  return response;
}
function handleError({ error, event }) {
  const errorId = Date.now().toString(16);
  if (process?.env.NODE_ENV === "development") console.error(error);
  process?.emit("sveltekit:error", { error, errorId, event });
  return {
    name: "Internal Server Error",
    message: error.message,
    errorId
  };
}
export {
  handle,
  handleError
};
