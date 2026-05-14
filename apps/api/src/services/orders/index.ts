/**
 * ORDER SYSTEM MODULE
 *
 * Central export for all order-related services.
 * Import from this file for all order operations.
 */

// Core order system
export {
  OrderStateMachine,
  ORDER_STATES,
  ORDER_EVENTS,
  canTransition,
  mapLegacyStatus,
  getStateLabel,
  getAllStates,
  type OrderState,
  type OrderEvent,
} from "../orderStateMachine";

export {
  eventBus,
  emitOrderEvent,
  type EventType,
  type EventPayload,
} from "../eventBus";

// Order operations
export {
  placeOrder,
  updateStatus,
  processOrderConfirmationReply,
  trackOrder,
  exportCSV,
  listStoreOrders,
  getOrderEventHistory,
} from "../orderService";

// Shipping & Courier
export {
  courierRegistry,
  initializeCourierAdapters,
  type CourierAdapter,
  type ShipmentData,
  type TrackingInfo,
  type ShipmentResult,
} from "../courierRegistry";

export {
  createShipment,
  trackShipment,
  cancelShipment,
  getShipmentByOrder,
  updateShipmentFromWebhook,
  getAvailableCouriers,
} from "../shippingService";

// WhatsApp automation
export {
  initializeWhatsAppAutomation,
  sendCustomMessage,
  getWhatsappLogs,
} from "../whatsappAutomation";

// Real-time sync
export {
  initializeWebSocket,
  getStoreClientCount,
  getActiveStores,
  broadcastToAllStores,
  sendToClient,
} from "../realtimeSync";