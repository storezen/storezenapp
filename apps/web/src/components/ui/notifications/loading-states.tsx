"use client";

import { useState, createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LoadingState {
  key: string;
  message?: string;
}

interface LoadingContextValue {
  loaders: LoadingState[];
  isLoading: boolean;
  startLoading: (key: string, message?: string) => void;
  stopLoading: (key: string) => void;
  stopAll: () => void;
}

// ── Context ────────────────────────────────────────────────────────────────────

const LoadingContext = createContext<LoadingContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loaders, setLoaders] = useState<LoadingState[]>([]);

  const startLoading = (key: string, message?: string) => {
    setLoaders((prev) => {
      // Don't add duplicate
      if (prev.some((l) => l.key === key)) return prev;
      return [...prev, { key, message }];
    });
  };

  const stopLoading = (key: string) => {
    setLoaders((prev) => prev.filter((l) => l.key !== key));
  };

  const stopAll = () => {
    setLoaders([]);
  };

  return (
    <LoadingContext.Provider
      value={{
        loaders,
        isLoading: loaders.length > 0,
        startLoading,
        stopLoading,
        stopAll,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
}

// ── Loading Overlay Component ───────────────────────────────────────────────────

export function GlobalLoadingOverlay() {
  const { loaders, isLoading } = useLoading();

  if (!isLoading) return null;

  const currentLoader = loaders[loaders.length - 1];

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
        {currentLoader?.message && (
          <p className="text-sm text-zinc-600 font-medium">{currentLoader.message}</p>
        )}
      </div>
    </div>
  );
}

// ── Button Loading Helper ─────────────────────────────────────────────────────

interface UseButtonLoadingOptions {
  onClick: () => Promise<void> | void;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function useButtonLoading({ onClick, onSuccess, onError }: UseButtonLoadingOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      await onClick();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, handleClick };
}

// ── Skeleton Loader ───────────────────────────────────────────────────────────

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-zinc-100",
        className
      )}
      {...props}
    />
  );
}

// Skeleton components for common patterns
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="border-b border-zinc-100 p-4">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ items = 8, columns = 4 }: { items?: number; columns?: number }) {
  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-zinc-200 p-4">
          <Skeleton className="w-full aspect-square rounded-lg mb-3" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ── Page Transition ───────────────────────────────────────────────────────────

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    </div>
  );
}

// ── Inline Loading Spinner ────────────────────────────────────────────────────

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2 className={cn("animate-spin text-zinc-400", sizeClasses[size])} />
  );
}

// ── Form Loading ─────────────────────────────────────────────────────────────

interface FormLoadingProps {
  isSubmitting: boolean;
  submitText?: string;
  loadingText?: string;
}

export function FormSubmitButton({
  isSubmitting,
  submitText = "Submit",
  loadingText = "Submitting...",
}: FormLoadingProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
        "bg-emerald-500 text-white hover:bg-emerald-600",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
      {isSubmitting ? loadingText : submitText}
    </button>
  );
}

// ── Async Button with Loading State ──────────────────────────────────────────

interface AsyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
}

export function AsyncButton({
  children,
  isLoading,
  loadingText,
  className,
  disabled,
  ...props
}: AsyncButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
        "bg-zinc-900 text-white hover:bg-zinc-800",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isLoading ? loadingText : children}
    </button>
  );
}

// ── Loading Context for API Calls ────────────────────────────────────────────

export function useApiLoading() {
  const { startLoading, stopLoading } = useLoading();

  const withLoading = async <T,>(
    key: string,
    fn: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    startLoading(key, message);
    try {
      return await fn();
    } finally {
      stopLoading(key);
    }
  };

  return { withLoading };
}