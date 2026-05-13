export interface User {
  id: string;
  name: string;
  email: string;
  plan?: string;
  storeId?: string | null;
  isAdmin?: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku?: string;
  image?: string;
  color?: string;
  size?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price?: number;
  cost_price?: number;
  stock?: number;
  low_stock_threshold?: number;
  images?: string[];
  variants?: ProductVariant[];
  description?: string;
  category?: string;
  tags?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_draft?: boolean;
  vendor?: string;
  product_type?: string;
  sku?: string;
  barcode?: string;
  track_inventory?: boolean;
  sort_order?: number;
  publish_at?: string;
  meta_title?: string;
  meta_desc?: string;
  urdu_description?: string;
  rating?: number;
  review_count?: number;
  delivery_days?: number;
  ships_from?: string;
  collection_ids?: string[];
  collection_labels?: string[];
  storeId?: string;
}

export interface ProductReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  images: string[];
  createdAt: string;
  verified: boolean;
}

export interface RatingStats {
  count: number;
  average: number;
  distribution: Record<number, number>;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  coupon_code?: string | null;
  ref_code?: string | null;
  tracking_number?: string | null;
  courier?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  qty: number;
  image: string;
}

export interface CartItem {
  /** Stable key for line item (product + optional variant). */
  lineKey: string;
  product_id: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  variantId?: string;
  variantName?: string;
}

export interface Stats {
  today_orders: number;
  today_revenue: number;
  month_orders: number;
  month_revenue: number;
  total_products: number;
  pending_orders: number;
}
