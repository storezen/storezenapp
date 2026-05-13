/**
 * SHIPPING SERVICE
 *
 * Handles shipping operations using courier adapters.
 * Uses the CourierRegistry for plug-and-play courier integration.
 */

import { db } from "../db";
import { shipmentsTable, ordersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { courierRegistry, type ShipmentData } from "./courierRegistry";
import { emitOrderEvent } from "./eventBus";

export interface CreateShipmentInput {
  orderId: string;
  storeId: string;
  courier: string;
  weight?: number;
  remarks?: string;
}

export interface ShippingResult {
  success: boolean;
  trackingNumber?: string;
  bookingId?: string;
  error?: string;
}

/**
 * Create a new shipment for an order
 */
export async function createShipment(input: CreateShipmentInput): Promise<ShippingResult> {
  const { orderId, storeId, courier, weight, remarks } = input;

  // Fetch order details
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .limit(1);

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  // Prepare shipment data for courier
  const shipmentData: ShipmentData = {
    orderId,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    customerCity: order.customerCity,
    weight,
    codAmount: Number(order.total),
    remarks,
  };

  try {
    // Create shipment with courier
    const result = await courierRegistry.createShipment(courier, shipmentData);

    if (result.success && result.trackingNumber) {
      // Store shipment record
      await db.insert(shipmentsTable).values({
        id: randomUUID(),
        orderId,
        storeId,
        courier,
        trackingNumber: result.trackingNumber,
        bookingId: result.bookingId,
        status: "booked",
        bookedAt: new Date(),
      });

      // Update order with tracking info
      await db
        .update(ordersTable)
        .set({
          courier,
          trackingNumber: result.trackingNumber,
        })
        .where(eq(ordersTable.id, orderId));

      // Emit shipping event
      emitOrderEvent(
        orderId,
        storeId,
        "order_shipped",
        order.orderStatus,
        "shipped",
        { courier, trackingNumber: result.trackingNumber }
      );
    }

    return result;
  } catch (error) {
    console.error("[ShippingService] Create shipment error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Track a shipment
 */
export async function trackShipment(courier: string, trackingNumber: string) {
  try {
    const trackingInfo = await courierRegistry.trackShipment(courier, trackingNumber);
    return { success: true, tracking: trackingInfo };
  } catch (error) {
    console.error("[ShippingService] Track shipment error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Cancel a shipment
 */
export async function cancelShipment(orderId: string, courier: string, trackingNumber: string) {
  try {
    const result = await courierRegistry.cancelShipment(courier, trackingNumber);

    if (result.success) {
      // Update shipment status
      await db
        .update(shipmentsTable)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(shipmentsTable.trackingNumber, trackingNumber));
    }

    return result;
  } catch (error) {
    console.error("[ShippingService] Cancel shipment error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get shipment details for an order
 */
export async function getShipmentByOrder(orderId: string) {
  const [shipment] = await db
    .select()
    .from(shipmentsTable)
    .where(eq(shipmentsTable.orderId, orderId))
    .limit(1);

  return shipment || null;
}

/**
 * Update shipment status from courier webhook
 */
export async function updateShipmentFromWebhook(
  courier: string,
  trackingNumber: string,
  status: string,
  rawStatus?: Record<string, unknown>
) {
  const [shipment] = await db
    .select()
    .from(shipmentsTable)
    .where(eq(shipmentsTable.trackingNumber, trackingNumber))
    .limit(1);

  if (!shipment) {
    return { success: false, error: "Shipment not found" };
  }

  // Update shipment
  await db
    .update(shipmentsTable)
    .set({
      status,
      rawStatus: rawStatus || {},
      updatedAt: new Date(),
    })
    .where(eq(shipmentsTable.id, shipment.id));

  // Map shipment status to order status
  let orderStatus: string | null = null;

  switch (status.toLowerCase()) {
    case "picked_up":
    case "in_transit":
      orderStatus = "in_transit";
      break;
    case "out_for_delivery":
      orderStatus = "out_for_delivery";
      break;
    case "delivered":
      orderStatus = "delivered";
      break;
    case "returned":
    case "rto":
      orderStatus = "returned";
      break;
    default:
      // Don't update order status for intermediate statuses
      break;
  }

  if (orderStatus) {
    // Get current order
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, shipment.orderId))
      .limit(1);

    if (order) {
      const { emitOrderEvent } = await import("./eventBus");
      emitOrderEvent(
        shipment.orderId,
        shipment.storeId,
        "order_status_updated",
        order.orderStatus,
        orderStatus,
        { courier, trackingNumber, shipmentStatus: status }
      );
    }
  }

  return { success: true };
}

/**
 * Get available couriers
 */
export function getAvailableCouriers() {
  return courierRegistry.getRegisteredCouriers();
}