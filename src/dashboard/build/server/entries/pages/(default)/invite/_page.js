import { redirect } from "@sveltejs/kit";
async function load({ url }) {
  redirect(307, `/auth/login?invite&guild=${url.searchParams.get("guild") || ""}`);
}
export {
  load
};
