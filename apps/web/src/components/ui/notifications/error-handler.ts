"use client";

import { useToast } from "./toast-system";
import { useModal } from "./modal-system";

// ── Error Types ────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  field?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  status?: number;
}

// ── Error Messages Map ─────────────────────────────────────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  UNAUTHORIZED: "Please login to continue.",
  TOKEN_EXPIRED: "Your session has expired. Please login again.",
  FORBIDDEN: "You don't have permission to perform this action.",
  INVALID_TOKEN: "Invalid authentication token.",

  // Order errors
  ORDER_NOT_FOUND: "Order not found.",
  ORDER_ALREADY_CANCELLED: "This order has already been cancelled.",
  ORDER_ALREADY_DELIVERED: "This order cannot be modified.",
  INVALID_STATUS_TRANSITION: "This status change is not allowed.",
  ORDER_NOT_YOUR_STORE: "You don't have access to this order.",

  // Product errors
  PRODUCT_NOT_FOUND: "Product not found.",
  PRODUCT_OUT_OF_STOCK: "This product is out of stock.",
  INSUFFICIENT_STOCK: "Not enough stock available.",
  PRODUCT_NOT_ACTIVE: "This product is not available.",

  // Validation errors
  VALIDATION_ERROR: "Please check your input.",
  MISSING_REQUIRED_FIELD: "Please fill in all required fields.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_PHONE: "Please enter a valid phone number.",

  // Network errors
  NETWORK_ERROR: "Network error. Please check your connection.",
  SERVER_ERROR: "Something went wrong. Please try again.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",

  // Generic
  UNKNOWN_ERROR: "An unexpected error occurred.",
};

// ── Error Handler Class ───────────────────────────────────────────────────────

export class ErrorHandler {
  private toast = useToast();
  private modal = useModal();

  /**
   * Handle API error response
   */
  handle(error: unknown): string {
    // API Error Response
    if (this.isApiError(error)) {
      const message = this.getMessage(error.message, error.code);
      this.toast.error(message);
      return message;
    }

    // Network Error
    if (this.isNetworkError(error)) {
      this.toast.error(ERROR_MESSAGES.NETWORK_ERROR);
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // Validation Error
    if (this.isValidationError(error)) {
      const message = this.formatValidationError(error);
      this.toast.warning(message);
      return message;
    }

    // Default
    const message = this.getMessage(String(error));
    this.toast.error(message);
    return message;
  }

  /**
   * Handle error with custom toast type
   */
  handleAs(type: "success" | "warning" | "info", error: unknown): string {
    const message = this.handle(error);
    return message;
  }

  /**
   * Handle error with modal
   */
  handleWithModal(error: unknown, title?: string): string {
    if (this.isApiError(error) && error.status && error.status >= 500) {
      this.modal.error(this.getMessage((error as Error).message, (error as ApiError).code), title || "Server Error");
    } else {
      this.handle(error);
    }
    return this.getMessage((error as Error).message || String(error));
  }

  /**
   * Handle error with retry option
   */
  handleWithRetry(error: unknown, onRetry: () => void, title?: string): string {
    const message = this.handle(error);
    // Could show a retry button here
    return message;
  }

  private isApiError(error: unknown): error is ApiError {
    return (
      typeof error === "object" &&
      error !== null &&
      ("message" in error || "error" in error)
    );
  }

  private isNetworkError(error: unknown): boolean {
    return (
      error instanceof TypeError ||
      (error instanceof Error && error.message.includes("fetch"))
    );
  }

  private isValidationError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "issues" in error
    );
  }

  private getMessage(message: string, code?: string): string {
    if (code && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }
    if (ERROR_MESSAGES[message]) {
      return ERROR_MESSAGES[message];
    }
    return message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  private formatValidationError(error: unknown): string {
    // Handle Zod-style validation errors
    if (error && typeof error === "object" && "issues" in error) {
      const issues = (error as { issues: Array<{ message: string }> }).issues;
      if (issues.length > 0) {
        return issues[0].message;
      }
    }
    return ERROR_MESSAGES.VALIDATION_ERROR;
  }
}

// ── Singleton Instance ─────────────────────────────────────────────────────────

let errorHandlerInstance: ErrorHandler | null = null;

export function getErrorHandler(): ErrorHandler {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new ErrorHandler();
  }
  return errorHandlerInstance;
}

// ── API Response Helpers ─────────────────────────────────────────────────────

export function isSuccessResponse(response: unknown): boolean {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    (response as { success: boolean }).success === true
  );
}

export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    (response as { success: boolean }).success === false
  );
}

// ── Async Handler Wrapper ──────────────────────────────────────────────────────

export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options?: {
    onError?: (error: unknown) => void;
    onSuccess?: () => void;
  }
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>) => {
    try {
      const result = await fn(...args);
      options?.onSuccess?.();
      return result as ReturnType<T>;
    } catch (error) {
      const handler = getErrorHandler();
      handler.handle(error);
      options?.onError?.(error);
      throw error;
    }
  };
}

// ── Auth Error Handler ─────────────────────────────────────────────────────────

export function handleAuthError(error: unknown): boolean {
  if (isApiErrorWithCode(error, "UNAUTHORIZED") || isApiErrorWithCode(error, "TOKEN_EXPIRED")) {
    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return true;
  }
  return false;
}

function isApiErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === code
  );
}

// ── Form Error Handler ─────────────────────────────────────────────────────────

export function handleFormError(error: unknown): Record<string, string> {
  const errors: Record<string, string> = {};

  if (error && typeof error === "object" && "issues" in error) {
    const issues = (error as { issues: Array<{ path: string[]; message: string }> }).issues;
    for (const issue of issues) {
      const field = issue.path[issue.path.length - 1] as string;
      errors[field] = issue.message;
    }
  }

  return errors;
}

// ── Retry Handler ──────────────────────────────────────────────────────────────

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }

      if (attempt < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// ── Debounced Error Handler ────────────────────────────────────────────────────

let errorDebounceTimer: NodeJS.Timeout | null = null;

export function debounceError(message: string) {
  if (errorDebounceTimer) {
    clearTimeout(errorDebounceTimer);
  }

  errorDebounceTimer = setTimeout(() => {
    getErrorHandler().handle({ message });
    errorDebounceTimer = null;
  }, 500);
}

// ── Global Error Handler Setup ────────────────────────────────────────────────

export function setupGlobalErrorHandlers() {
  if (typeof window === "undefined") return;

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled Promise Rejection:", event.reason);
    getErrorHandler().handle(event.reason);
    event.preventDefault();
  });

  // Handle uncaught errors
  window.addEventListener("error", (event) => {
    // Don't handle React errors
    if (event.message?.includes("React")) return;

    console.error("Uncaught Error:", event.error);
    getErrorHandler().handle(event.error);
  });
}