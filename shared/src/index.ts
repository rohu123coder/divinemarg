export type ApiErrorShape = {
  code: string;
  message: string;
};

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
