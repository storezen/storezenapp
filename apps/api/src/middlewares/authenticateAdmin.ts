import { type NextFunction, type Request, type Response } from "express";
import { authenticate } from "./authenticate";

export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  return authenticate(req, res, () => {
    if (!req.user?.isAdmin) {
      return res.status(401).json({ error: "Admin access required" });
    }
    return next();
  });
}

