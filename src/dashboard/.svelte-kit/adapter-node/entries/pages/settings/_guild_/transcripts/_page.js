import "@sveltejs/kit";
async function load({ fetch, params }) {
  try {
    return {
      transcripts: [],
      totalTranscripts: 0,
      searched: false
    };
  } catch (err) {
    console.error("Failed to load transcripts:", err);
    return {
      transcripts: [],
      totalTranscripts: 0,
      searched: false
    };
  }
}
export {
  load
};
