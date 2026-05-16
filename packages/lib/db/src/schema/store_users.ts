import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const storeUsersTable = pgTable("store_users", {
  id:          text("id").primaryKey(),
  userId:      text("user_id").notNull(),
  storeId:     text("store_id").notNull(),
  role:        text("role").notNull().default("viewer"), // owner, admin, manager, viewer
  
  // Permissions (for custom permissions beyond role)
  permissions: text("permissions").array().notNull().default([]),

  // Status
  status:      text("status").notNull().default("active"), // active, invited, suspended

  // Invitation
  invitationToken: text("invitation_token"),
  invitedAt:      timestamp("invited_at", { withTimezone: true }),
  joinedAt:       timestamp("joined_at", { withTimezone: true }),

  // Limits
  maxInvites: integer("max_invites").notNull().default(0),

  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// Role enum
export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  VIEWER: "viewer",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Permission checks
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  owner: [
    "store:read", "store:update", "store:delete",
    "users:read", "users:invite", "users:manage", "users:remove",
    "products:read", "products:create", "products:update", "products:delete",
    "orders:read", "orders:update", "orders:delete",
    "collections:read", "collections:create", "collections:update", "collections:delete",
    "billing:read", "billing:manage",
    "settings:read", "settings:update",
    "ai:use",
  ],
  admin: [
    "store:read", "store:update",
    "users:read", "users:invite", "users:manage",
    "products:read", "products:create", "products:update", "products:delete",
    "orders:read", "orders:update",
    "collections:read", "collections:create", "collections:update", "collections:delete",
    "billing:read",
    "settings:read", "settings:update",
    "ai:use",
  ],
  manager: [
    "products:read", "products:create", "products:update", "products:delete",
    "orders:read", "orders:update",
    "collections:read", "collections:create", "collections:update",
    "ai:use",
  ],
  viewer: [
    "products:read",
    "orders:read",
    "collections:read",
  ],
};

export const insertStoreUserSchema = createInsertSchema(storeUsersTable).omit({
  createdAt: true, updatedAt: true, invitedAt: true, joinedAt: true,
});

export type InsertStoreUser = z.infer<typeof insertStoreUserSchema>;
export type StoreUser = typeof storeUsersTable.$inferSelect;
