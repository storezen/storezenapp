/**
 * ORDER SYSTEM ARCHITECTURE
 *
 * Production-grade, event-driven order system with:
 * - State machine for controlled status transitions
 * - Event bus for loose coupling between modules
 * - Pluggable courier system
 * - WhatsApp automation ready
 * - Real-time WebSocket sync
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │                      ORDER FLOW                              │
 * └─────────────────────────────────────────────────────────────┘
 *
 *  placed order
 *      │
 *      ▼
 * ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
 * │ State       │───▶│ Event Bus    │───▶│ WhatsApp    │
 * │ Machine     │    │ (central)    │    │ Automation  │
 * └─────────────┘    └──────────────┘    └─────────────┘
 *      │                   │
 *      │                   ▼
 *      │            ┌──────────────┐
 *      │            │ Real-time    │
 *      │            │ WebSocket    │
 *      │            └──────────────┘
 *      │
 *      ▼
 * ┌─────────────┐
 * │ Courier     │
 * │ Registry    │
 * └─────────────┘
 *
 * ─────────────────────────────────────────────────────────────────
 * ORDER STATES
 * ─────────────────────────────────────────────────────────────────
 *
 * created → pending_confirmation → confirmed → processing → packed
 *   → shipped → in_transit → out_for_delivery → delivered
 *
 * Terminal states: delivered, cancelled, returned
 *
 * ─────────────────────────────────────────────────────────────────
 * EVENTS
 * ─────────────────────────────────────────────────────────────────
 *
 * - order_created
 * - order_confirmed
 * - order_status_updated
 * - order_shipped
 * - order_delivered
 * - order_cancelled
 * - order_returned
 *
 * All events are:
 * - Stored in database (event sourcing)
 * - Broadcast via WebSocket
 * - Consumed by automation modules
 *
 * ─────────────────────────────────────────────────────────────────
 * COURIER ADAPTERS
 * ─────────────────────────────────────────────────────────────────
 *
 * Pluggable system - add new couriers without changing order logic:
 *
 * - GenericCourierAdapter (fallback)
 * - PostExAdapter (ready for integration)
 * - TCXAdapter (ready for integration)
 *
 * Add new courier:
 * ```js
 * courierRegistry.registerAdapter(new MyCourierAdapter());
 * ```
 *
 * ─────────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────────
 *
 * ```typescript
 * import { placeOrder, updateStatus, ORDER_STATES } from './orders';
 *
 * // Place order - emits order_created event
 * const order = await placeOrder({ storeId, customerName, ... });
 *
 * // Update status - validated by state machine
 * const updated = await updateStatus(orderId, ORDER_STATES.SHIPPED, storeId);
 *
 * // Event automatically triggers:
 * // - Database update
 * // - Event log
 * // - WebSocket broadcast
 * // - WhatsApp notification (if enabled)
 * // - Courier integration (if configured)
 * ```
 *
 * ─────────────────────────────────────────────────────────────────
 * INITIALIZATION
 * ─────────────────────────────────────────────────────────────────
 *
 * In app.ts or main entry:
 *
 * ```typescript
 * import { initializeWhatsAppAutomation, initializeCourierAdapters } from './services/orders';
 *
 * // Initialize WhatsApp automation (listens for events)
 * initializeWhatsAppAutomation();
 *
 * // Initialize courier adapters from config
 * initializeCourierAdapters({
 *   postexApiKey: process.env.POSTEX_API_KEY,
 *   defaultCourier: 'postex'
 * });
 * ```
 *
 * For WebSocket:
 * ```typescript
 * import { initializeWebSocket } from './services/orders';
 *
 * const io = initializeWebSocket(httpServer);
 * ```
 *
 * ─────────────────────────────────────────────────────────────────
 * DATABASE
 * ─────────────────────────────────────────────────────────────────
 *
 * New tables added:
 * - order_events (event sourcing log)
 * - shipments (courier tracking)
 *
 * Extended tables:
 * - orders (status history via order_events)
 *
 * ─────────────────────────────────────────────────────────────────
 * SECURITY
 * ─────────────────────────────────────────────────────────────────
 *
 * - Only backend can update order status
 * - State machine validates all transitions
 * - Store ownership verified on all operations
 * - Event log provides audit trail
 *
 * ─────────────────────────────────────────────────────────────────
 * SCALABILITY
 * ─────────────────────────────────────────────────────────────────
 *
 * - Event-driven: modules are loosely coupled
 * - WebSocket: real-time without polling
 * - Courier system: plug-and-play
 * - Event sourcing: full audit trail
 *
 */