"use client";

import Image, { type ImageProps } from "next/image";
import { shouldUnoptimizeImageSrc } from "@/lib/images";

/**
 * For user-supplied / CDN images: avoid Next's optimizer fetch (often 403 on cheap hosting & foreign CDNs).
 * Local `import img from "..."` still uses the default optimizer.
 */
export function CdnImage({ src, alt, unoptimized, ...rest }: ImageProps) {
  if (typeof src !== "string") {
    return <Image src={src} alt={alt} {...rest} />;
  }
  if (!src) return null;
  const bypass = unoptimized ?? shouldUnoptimizeImageSrc(src);
  return <Image src={src} alt={alt} unoptimized={bypass} {...rest} />;
}
