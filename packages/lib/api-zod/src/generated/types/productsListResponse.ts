/**
 * Code generated for API types
 * Do not edit manually.
 * Api
 * API specification
 * OpenAPI spec version: 0.1.0
 */
import type { Product } from "./product";

export interface ProductsListResponse {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}
