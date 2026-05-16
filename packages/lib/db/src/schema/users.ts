import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id:          text("id").primaryKey(),
  email:       text("email").notNull().unique(),
  password:    text("password").notNull(),
  name:        text("name").notNull(),
  avatar:      text("avatar"),
  phone:       text("phone"),

  // Auth
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"),

  // Password reset
  resetToken:     text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),

  // Settings
  preferences: text("preferences"), // JSON

  active:      boolean("active").notNull().default(true),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  createdAt: true, updatedAt: true,
  emailVerified: true, verificationToken: true, resetToken: true, resetTokenExpiry: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
