// FR-4.3: answers are saved as you go; you continue at the first unanswered question; no submit with gaps.
const answered = (answers, id) => answers[id] != null || answers[String(id)] != null;
export const firstUnanswered = (items, answers) => items.findIndex((it) => !answered(answers, it.item_id));
export const missingCount = (items, answers) => items.filter((it) => !answered(answers, it.item_id)).length;
export const progress = (items, answers) => (items.length ? (items.length - missingCount(items, answers)) / items.length : 0);
