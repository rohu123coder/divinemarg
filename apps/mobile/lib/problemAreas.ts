/** Shared with chat problem-area and Hand & Face Reading (values match backend). */
export const PROBLEM_AREAS = [
  { value: "Career and Business", label: "Career & Business", emoji: "💼" },
  { value: "Love and Relationship", label: "Love & Relationship", emoji: "💕" },
  { value: "Marriage", label: "Marriage", emoji: "💍" },
  { value: "Financial Problems", label: "Financial", emoji: "💰" },
  { value: "Family Issues", label: "Family Issues", emoji: "👨‍👩‍👧" },
  { value: "Health", label: "Health", emoji: "🏥" },
  { value: "Education", label: "Education", emoji: "🎓" },
  { value: "Other", label: "Other", emoji: "✨" },
] as const;

export type ProblemAreaValue = (typeof PROBLEM_AREAS)[number]["value"];
