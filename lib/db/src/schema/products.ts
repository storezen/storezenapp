import { pgTable, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id:              text("id").primaryKey(),                    // e.g. "tshirt-1"
  name:            text("name").notNull(),
  slug:            text("slug"),
  description:     text("description"),
  price:           integer("price").notNull(),                 // PKR
  compareAtPrice:  integer("compare_at_price"),
  stock:           integer("stock").notNull().default(0),
  category:        text("category").notNull().default("General"),
  image:           text("image").notNull().default(""),
  images:          text("images").array().notNull().default([]),
  tags:            text("tags").array().notNull().default([]),
  active:          boolean("active").notNull().default(true),
  variants:        jsonb("variants"),                         // JSON array of variant options
  metaTitle:       text("meta_title"),
  metaDescription: text("meta_description"),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  createdAt: true, updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type DbProduct = typeof productsTable.$inferSelect;
