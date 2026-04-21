import type { AuthUser } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      /** First subdomain label when request Host maps to a tenant (see storeFromHost middleware). */
      storeSlugFromHost?: string;
    }
  }
}

export {};

