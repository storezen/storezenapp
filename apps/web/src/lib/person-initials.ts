/**
 * Two-letter avatar label from a person or account name. Falls back to email local part.
 */
export function personInitials(name: string, email?: string | null): string {
  const raw = name.replace(/\s+/g, " ").trim() || (email ? email.split("@")[0]?.replace(/[._-]+/g, " ") ?? "" : "");
  if (!raw) return "–";
  const parts = raw.split(" ").filter((p) => p.length > 0);
  if (parts.length >= 2) {
    const a = parts[0]!.charAt(0);
    const b = parts[parts.length - 1]!.charAt(0);
    return (a + b).toUpperCase();
  }
  const single = parts[0] ?? raw;
  if (single.length >= 2) {
    return single.slice(0, 2).toUpperCase();
  }
  return (single + single).slice(0, 2).toUpperCase();
}
