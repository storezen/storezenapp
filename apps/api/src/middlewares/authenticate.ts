import { type NextFunction, type Request, type Response } from "express";
import { verifyToken } from "../services/auth.service";

export interface AuthUser {
  id: string;
  email: string;
  storeId: string | null;
  role: "owner" | "admin" | "manager" | "viewer" | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Missing or invalid authorization header" });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
      storeId: payload.storeId,
      role: payload.role,
    };
    return next();
  } catch {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid or expired token" });
  }
}
