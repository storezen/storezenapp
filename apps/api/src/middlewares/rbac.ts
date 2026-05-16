import { type NextFunction, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, storeUsersTable, ROLE_PERMISSIONS, type Role } from "@storepk/db";

export type Permission = 
  | "store:read" | "store:update" | "store:delete"
  | "users:read" | "users:invite" | "users:manage" | "users:remove"
  | "products:read" | "products:create" | "products:update" | "products:delete"
  | "orders:read" | "orders:update" | "orders:delete"
  | "collections:read" | "collections:create" | "collections:update" | "collections:delete"
  | "billing:read" | "billing:manage"
  | "settings:read" | "settings:update"
  | "ai:use";

/**
 * RBAC Middleware
 * Enforces role-based permissions before controller execution
 * 
 * Usage:
 * - requirePermission("products:create")
 * - requireAnyRole(["owner", "admin"])
 * - requireRole("owner")
 */
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Auth check
      if (!req.user) {
        return res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication required" });
      }

      // Tenant check
      if (!req.tenant) {
        return res.status(400).json({ error: "TENANT_REQUIRED", message: "Store context required" });
      }

      const { storeId } = req.tenant;
      const { id: userId, role } = req.user;

      // Owner has all permissions
      if (role === "owner") {
        return next();
      }

      // Get user's store role from database
      const [storeUser] = await db
        .select()
        .from(storeUsersTable)
        .where(eq(storeUsersTable.userId, userId))
        .where(eq(storeUsersTable.storeId, storeId))
        .where(eq(storeUsersTable.status, "active"))
        .limit(1);

      if (!storeUser) {
        return res.status(403).json({ error: "FORBIDDEN", message: "Access denied to this store" });
      }

      // Get role-based permissions
      const permissions = ROLE_PERMISSIONS[storeUser.role as Role] || [];

      // Check custom permissions (if any)
      const customPermissions = storeUser.permissions || [];
      const allPermissions = [...permissions, ...customPermissions];

      // Check if user has the required permission
      if (!allPermissions.includes(permission)) {
        return res.status(403).json({
          error: "FORBIDDEN",
          message: `Missing required permission: ${permission}`,
        });
      }

      return next();
    } catch (error) {
      console.error("RBAC error:", error);
      return res.status(500).json({ error: "INTERNAL_ERROR", message: "Permission check failed" });
    }
  };
}

/**
 * Require specific role(s)
 */
export function requireRole(...allowedRoles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication required" });
      }

      if (!req.tenant) {
        return res.status(400).json({ error: "TENANT_REQUIRED", message: "Store context required" });
      }

      const { storeId } = req.tenant;
      const { id: userId } = req.user;

      // Check store_users table
      const [storeUser] = await db
        .select()
        .from(storeUsersTable)
        .where(eq(storeUsersTable.userId, userId))
        .where(eq(storeUsersTable.storeId, storeId))
        .where(eq(storeUsersTable.status, "active"))
        .limit(1);

      if (!storeUser) {
        return res.status(403).json({ error: "FORBIDDEN", message: "Access denied to this store" });
      }

      if (!allowedRoles.includes(storeUser.role as Role)) {
        return res.status(403).json({
          error: "FORBIDDEN",
          message: `Role '${storeUser.role}' is not authorized. Required: ${allowedRoles.join(" or ")}`,
        });
      }

      // Update req.user with role from DB
      req.user.role = storeUser.role as Role;

      return next();
    } catch (error) {
      console.error("Role check error:", error);
      return res.status(500).json({ error: "INTERNAL_ERROR", message: "Role verification failed" });
    }
  };
}

/**
 * Require owner only (most restrictive)
 */
export function requireOwner() {
  return requireRole("owner");
}

/**
 * Require owner or admin
 */
export function requireAdmin() {
  return requireRole("owner", "admin");
}

/**
 * Require owner, admin, or manager
 */
export function requireManager() {
  return requireRole("owner", "admin", "manager");
}
