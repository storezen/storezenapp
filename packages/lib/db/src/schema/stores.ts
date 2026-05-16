import { pgTable, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const storesTable = pgTable("stores", {
  id:          text("id").primaryKey(),
  name:        text("name").notNull(),
  slug:        text("slug").notNull().unique(),
  domain:      text("domain"),
  description: text("description"),
  logo:        text("logo"),
  coverImage:  text("cover_image"),
  email:       text("email"),
  phone:       text("phone"),
  address:     text("address"),
  city:        text("city"),
  country:     text("country").notNull().default("Pakistan"),
  currency:    text("currency").notNull().default("PKR"),
  timezone:    text("timezone").notNull().default("Asia/Karachi"),

  plan:        text("plan").notNull().default("free"),
  status:      text("status").notNull().default("active"),

  maxProducts: integer("max_products").notNull().default(100),
  maxUsers:    integer("max_users").notNull().default(5),

  features:    text("features").array().notNull().default([]),
  metadata:    text("metadata"),

  active:      boolean("active").notNull().default(true),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStoreSchema = createInsertSchema(storesTable).omit({
  createdAt: true, updatedAt: true,
});

export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof storesTable.$inferSelect;
