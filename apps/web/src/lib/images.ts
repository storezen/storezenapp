/**
 * Product `images` in DB is jsonb: sometimes a real JSON array, sometimes double-encoded or malformed in the wild.
 * Returns a list of displayable URL strings.
 */
export function normalizeProductImages(raw: unknown): string[] {
  if (raw == null) return [];

  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    if (t.startsWith("[")) {
      try {
        return normalizeProductImages(JSON.parse(t));
      } catch {
        return looksLikeUrl(t) ? [t] : [];
      }
    }
    return looksLikeUrl(t) ? [t] : [];
  }

  if (!Array.isArray(raw)) return [];

  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const u = item.trim();
      if (u && (looksLikeUrl(u) || u.startsWith("/"))) out.push(u);
    } else if (item && typeof item === "object" && "url" in (item as object)) {
      const u = String((item as { url: unknown }).url).trim();
      if (u && (looksLikeUrl(u) || u.startsWith("/"))) out.push(u);
    }
  }
  return out;
}

function looksLikeUrl(s: string) {
  return s.startsWith("https://") || s.startsWith("http://");
}

/** Remote URLs often break `next/image` optimization (server fetch 403/timeout). */
export function shouldUnoptimizeImageSrc(src: string) {
  if (!src) return true;
  return looksLikeUrl(src) || src.startsWith("//");
}
