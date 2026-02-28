import "@sveltejs/kit";
async function load({ fetch, params }) {
  const fetchOptions = { credentials: "include" };
  try {
    const ticketsRes = await fetch(`/api/admin/guilds/${params.guild}/tickets?limit=100`, fetchOptions);
    const tickets = ticketsRes.ok ? await ticketsRes.json() : [];
    const transcripts = Array.isArray(tickets) ? tickets.filter((t) => t.transcript) : [];
    return {
      transcripts,
      totalTranscripts: transcripts.length
    };
  } catch (err) {
    console.error("Failed to load transcripts:", err);
    return {
      transcripts: [],
      totalTranscripts: 0
    };
  }
}
export {
  load
};
