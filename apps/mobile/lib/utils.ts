export function firstName(name: string | null | undefined): string {
  if (!name) return "Astrologer";
  return name.trim().split(" ")[0];
}
