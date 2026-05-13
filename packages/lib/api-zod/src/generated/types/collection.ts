/**
 * Code generated for API types
 * Do not edit manually.
 * Api
 * API specification
 * OpenAPI spec version: 0.1.0
 */

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
