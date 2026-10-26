export class NotFoundError extends Error {}
export class ValidationError extends Error {}
// The AI model is rate-limited or overloaded; the learner should try again later.
export class AIBusyError extends Error {}
