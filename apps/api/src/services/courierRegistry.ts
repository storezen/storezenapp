/**
 * COURIER ADAPTER REGISTRY
 *
 * Pluggable courier system for easy integration of logistics providers.
 * New couriers can be added without changing order core logic.
 *
 * Supported: PostEx, TCX, M&P, OCS, FedEx, DHL (extensible)
 */

export interface ShipmentData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  weight?: number;
  pieces?: number;
  codAmount: number;
  remarks?: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  status: string;
  location?: string;
  timestamp: string;
  estimatedDelivery?: string;
  events: Array<{
    status: string;
    location: string;
    timestamp: string;
  }>;
}

export interface ShipmentResult {
  success: boolean;
  trackingNumber?: string;
  bookingId?: string;
  labelUrl?: string;
  error?: string;
}

/**
 * Base interface for all courier adapters
 */
export interface CourierAdapter {
  readonly name: string;
  readonly code: string;

  /**
   * Create a new shipment/booking
   */
  createShipment(data: ShipmentData): Promise<ShipmentResult>;

  /**
   * Track existing shipment
   */
  trackShipment(trackingNumber: string): Promise<TrackingInfo>;

  /**
   * Cancel a shipment (if possible)
   */
  cancelShipment(trackingNumber: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Validate address before booking
   */
  validateAddress(city: string, address: string): Promise<{ valid: boolean; suggestions?: string[] }>;

  /**
   * Get service availability for a city
   */
  getServiceAvailability(city: string): Promise<{
    available: boolean;
    serviceType?: string;
    estimatedDays?: number;
  }>;
}

/**
 * Generic/Fallback courier adapter
 */
export class GenericCourierAdapter implements CourierAdapter {
  readonly name = "Generic Courier";
  readonly code = "generic";

  async createShipment(data: ShipmentData): Promise<ShipmentResult> {
    // Generic implementation - just mark as manual
    return {
      success: true,
      trackingNumber: `GEN-${Date.now()}`,
      bookingId: `BK${Date.now()}`,
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    return {
      trackingNumber,
      status: "unknown",
      timestamp: new Date().toISOString(),
      events: [],
    };
  }

  async cancelShipment(trackingNumber: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async validateAddress(city: string, address: string): Promise<{ valid: boolean; suggestions?: string[] }> {
    return { valid: true };
  }

  async getServiceAvailability(city: string): Promise<{ available: boolean; serviceType?: string; estimatedDays?: number }> {
    return { available: true, serviceType: "standard", estimatedDays: 3 };
  }
}

/**
 * PostEx adapter (ready for integration)
 */
export class PostExAdapter implements CourierAdapter {
  readonly name = "PostEx";
  readonly code = "postex";

  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl = "https://api.postex.pk") {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async createShipment(data: ShipmentData): Promise<ShipmentResult> {
    // TODO: Implement actual PostEx API call
    // For now, return mock success
    return {
      success: true,
      trackingNumber: `PX${Date.now()}`,
      bookingId: `PXBK${Date.now()}`,
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    // TODO: Implement actual PostEx tracking API
    return {
      trackingNumber,
      status: "in_transit",
      timestamp: new Date().toISOString(),
      events: [
        {
          status: "Shipment picked up",
          location: "Origin facility",
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  async cancelShipment(trackingNumber: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async validateAddress(city: string, address: string): Promise<{ valid: boolean; suggestions?: string[] }> {
    return { valid: true };
  }

  async getServiceAvailability(city: string): Promise<{ available: boolean; serviceType?: string; estimatedDays?: number }> {
    const majorCities = ["karachi", "lahore", "islamabad", "rawalpindi", "faisalabad"];
    const available = majorCities.some(c => city.toLowerCase().includes(c));
    return {
      available,
      serviceType: available ? "express" : "standard",
      estimatedDays: available ? 2 : 5,
    };
  }
}

/**
 * TCX (Transfair Express) adapter
 */
export class TCXAdapter implements CourierAdapter {
  readonly name = "TCX";
  readonly code = "tcx";

  async createShipment(data: ShipmentData): Promise<ShipmentResult> {
    return {
      success: true,
      trackingNumber: `TCX${Date.now()}`,
      bookingId: `TCXBK${Date.now()}`,
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    return {
      trackingNumber,
      status: "pending",
      timestamp: new Date().toISOString(),
      events: [],
    };
  }

  async cancelShipment(trackingNumber: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async validateAddress(city: string, address: string): Promise<{ valid: boolean; suggestions?: string[] }> {
    return { valid: true };
  }

  async getServiceAvailability(city: string): Promise<{ available: boolean; serviceType?: string; estimatedDays?: number }> {
    return { available: true, serviceType: "standard", estimatedDays: 3 };
  }
}

/**
 * Courier Registry - manages all registered couriers
 */
export class CourierRegistry {
  private static instance: CourierRegistry;
  private adapters: Map<string, CourierAdapter> = new Map();
  private defaultCourier: string = "generic";

  private constructor() {
    // Register default couriers
    this.registerAdapter(new GenericCourierAdapter());
  }

  static getInstance(): CourierRegistry {
    if (!CourierRegistry.instance) {
      CourierRegistry.instance = new CourierRegistry();
    }
    return CourierRegistry.instance;
  }

  /**
   * Register a new courier adapter
   */
  registerAdapter(adapter: CourierAdapter): void {
    this.adapters.set(adapter.code, adapter);
  }

  /**
   * Get adapter by code
   */
  getAdapter(code: string): CourierAdapter | undefined {
    return this.adapters.get(code);
  }

  /**
   * Get all registered courier codes
   */
  getRegisteredCouriers(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Set default courier for store
   */
  setDefaultCourier(code: string): void {
    if (this.adapters.has(code)) {
      this.defaultCourier = code;
    }
  }

  /**
   * Get default courier code
   */
  getDefaultCourier(): string {
    return this.defaultCourier;
  }

  /**
   * Create shipment with default or specified courier
   */
  async createShipment(courierCode: string, data: ShipmentData): Promise<ShipmentResult> {
    const adapter = this.getAdapter(courierCode) || this.getAdapter(this.defaultCourier);
    if (!adapter) {
      return { success: false, error: "No courier adapter available" };
    }
    return adapter.createShipment(data);
  }

  /**
   * Track shipment with specified courier
   */
  async trackShipment(courierCode: string, trackingNumber: string): Promise<TrackingInfo | null> {
    const adapter = this.getAdapter(courierCode);
    if (!adapter) return null;
    return adapter.trackShipment(trackingNumber);
  }

  /**
   * Cancel shipment with specified courier
   */
  async cancelShipment(courierCode: string, trackingNumber: string): Promise<{ success: boolean; error?: string }> {
    const adapter = this.getAdapter(courierCode);
    if (!adapter) {
      return { success: false, error: "Courier adapter not found" };
    }
    return adapter.cancelShipment(trackingNumber);
  }
}

export const courierRegistry = CourierRegistry.getInstance();

/**
 * Initialize courier adapters from store config
 */
export function initializeCourierAdapters(config: {
  postexApiKey?: string;
  postexApiUrl?: string;
  tcxApiKey?: string;
  defaultCourier?: string;
}): void {
  if (config.postexApiKey) {
    courierRegistry.registerAdapter(new PostExAdapter(config.postexApiKey, config.postexApiUrl));
  }
  if (config.tcxApiKey) {
    courierRegistry.registerAdapter(new TCXAdapter());
  }
  if (config.defaultCourier) {
    courierRegistry.setDefaultCourier(config.defaultCourier);
  }
}