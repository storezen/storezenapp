import { pgTable, text, integer, primaryKey } from "drizzle-orm/pg-core";
import { collectionsTable } from "./collections";
import { productsTable } from "./products";

export const productCollectionsTable = pgTable(
  "product_collections",
  {
    productId:    text("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
    collectionId: integer("collection_id").notNull().references(() => collectionsTable.id, { onDelete: "cascade" }),
    sortOrder:    integer("sort_order").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.productId, table.collectionId] })],
);

export type ProductCollection = typeof productCollectionsTable.$inferSelect;
