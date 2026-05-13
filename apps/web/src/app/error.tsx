"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto my-10 max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <h2 className="text-xl font-bold text-red-700">Something went wrong</h2>
      <p className="mt-2 text-sm text-red-600">Please retry. If issue persists, contact support on WhatsApp.</p>
      <Button onClick={reset} className="mt-4">
        Try again
      </Button>
    </div>
  );
}
