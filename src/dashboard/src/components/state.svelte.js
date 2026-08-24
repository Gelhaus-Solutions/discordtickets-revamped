export const questionsState = $state({ questions: [] });

/**
 * The feedback form being edited, kept apart from the category's own questions.
 *
 * Both are edited by the same `CategoryQuestions/Questions.svelte`, and the
 * category page shows both at once — so a single shared store would have the two
 * builders writing over each other. The component takes its store as a prop for
 * that reason; this is the second one.
 */
export const feedbackQuestionsState = $state({ questions: [] });

export const tagsState = $state({ tags: [] });
