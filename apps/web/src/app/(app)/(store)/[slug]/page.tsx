"use client";

import Link from "next/link";

export default function CmsStorefrontPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <p className="text-6xl font-extrabold text-zinc-200">404</p>
      <p className="mt-4 text-xl font-bold text-zac-700">Page not found</p>
      <p className="mt-2 text-sm text-zinc-500">This page doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 text-sm font-medium text-emerald-600 hover:text-emerald-700">
        &larr; Go to homepage
      </Link>
    </div>
  );
}
