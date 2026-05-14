/**
 * ORDER STATE MACHINE
 *
 * Controls all order status transitions.
 * All order status changes MUST go through this state machine.
 * Invalid transitions are blocked with clear error messages.
 */

// Unified Order States
export const ORDER_STATES = {
  CREATED: "created",
  PENDING_CONFIRMATION: "pending_confirmation",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  PACKED: "packed",
  SHIPPED: "shipped",
  IN_TRANSIT: "in_transit",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURNED: "returned",
} as const;

export type OrderState = typeof ORDER_STATES[keyof typeof ORDER_STATES];

// Valid state transitions
const STATE_TRANSITIONS: Record<OrderState, OrderState[]> = {
  [ORDER_STATES.CREATED]: [ORDER_STATES.PENDING_CONFIRMATION, ORDER_STATES.CONFIRMED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.PENDING_CONFIRMATION]: [ORDER_STATES.CONFIRMED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.CONFIRMED]: [ORDER_STATES.PROCESSING, ORDER_STATES.CANCELLED],
  [ORDER_STATES.PROCESSING]: [ORDER_STATES.PACKED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.PACKED]: [ORDER_STATES.SHIPPED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.SHIPPED]: [ORDER_STATES.IN_TRANSIT, ORDER_STATES.CANCELLED],
  [ORDER_STATES.IN_TRANSIT]: [ORDER_STATES.OUT_FOR_DELIVERY, ORDER_STATES.CANCELLED],
  [ORDER_STATES.OUT_FOR_DELIVERY]: [ORDER_STATES.DELIVERED, ORDER_STATES.RETURNED],
  [ORDER_STATES.DELIVERED]: [],
  [ORDER_STATES.CANCELLED]: [],
  [ORDER_STATES.RETURNED]: [],
};

// Event types emitted by state machine
export const ORDER_EVENTS = {
  CREATED: "order_created",
  CONFIRMED: "order_confirmed",
  STATUS_UPDATED: "order_status_updated",
  SHIPPED: "order_shipped",
  DELIVERED: "order_delivered",
  CANCELLED: "order_cancelled",
  RETURNED: "order_returned",
} as const;

export type OrderEvent = typeof ORDER_EVENTS[keyof typeof ORDER_EVENTS];

// Map states to events
function getEventForTransition(from: OrderState, to: OrderState): OrderEvent | null {
  if (to === ORDER_STATES.CONFIRMED && from === ORDER_STATES.CREATED) return ORDER_EVENTS.CONFIRMED;
  if (to === ORDER_STATES.SHIPPED || to === ORDER_STATES.IN_TRANSIT || to === ORDER_STATES.OUT_FOR_DELIVERY) return ORDER_EVENTS.SHIPPED;
  if (to === ORDER_STATES.DELIVERED) return ORDER_EVENTS.DELIVERED;
  if (to === ORDER_STATES.CANCELLED) return ORDER_EVENTS.CANCELLED;
  if (to === ORDER_STATES.RETURNED) return ORDER_EVENTS.RETURNED;
  return ORDER_EVENTS.STATUS_UPDATED;
}

// State machine class
export class OrderStateMachine {
  private currentState: OrderState;
  private orderId: string;

  constructor(initialState: OrderState, orderId: string) {
    this.currentState = initialState;
    this.orderId = orderId;
  }

  getState(): OrderState {
    return this.currentState;
  }

  canTransition(to: OrderState): boolean {
    const allowed = STATE_TRANSITIONS[this.currentState] || [];
    return allowed.includes(to);
  }

  getAllowedTransitions(): OrderState[] {
    return STATE_TRANSITIONS[this.currentState] || [];
  }

  /**
   * Transition to a new state
   * Returns the event to emit, or throws if invalid transition
   */
  transition(to: OrderState): { event: OrderEvent; from: OrderState; to: OrderState } {
    if (!this.canTransition(to)) {
      throw new Error(
        `Invalid transition from '${this.currentState}' to '${to}'. ` +
        `Allowed transitions: ${this.getAllowedTransitions().join(", ") || "none"}`
      );
    }

    const from = this.currentState;
    const event = getEventForTransition(from, to);
    if (!event) throw new Error("Invalid transition event");
    this.currentState = to;

    return { event: event as OrderEvent, from, to };
  }

  /**
   * Check if order is in a terminal state
   */
  isTerminal(): boolean {
    const state = this.currentState;
    return state === ORDER_STATES.DELIVERED || state === ORDER_STATES.CANCELLED || state === ORDER_STATES.RETURNED;
  }

  /**
   * Check if order is active (can still be updated)
   */
  isActive(): boolean {
    return !this.isTerminal();
  }
}

/**
 * Helper function to validate transition without creating machine instance
 */
export function canTransition(from: OrderState, to: OrderState): boolean {
  const allowed = STATE_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

/**
 * Get all valid states (for validation)
 */
export function getAllStates(): OrderState[] {
  return Object.values(ORDER_STATES);
}

/**
 * Get human-readable label for state
 */
export function getStateLabel(state: OrderState): string {
  const labels: Record<OrderState, string> = {
    [ORDER_STATES.CREATED]: "Created",
    [ORDER_STATES.PENDING_CONFIRMATION]: "Pending Confirmation",
    [ORDER_STATES.CONFIRMED]: "Confirmed",
    [ORDER_STATES.PROCESSING]: "Processing",
    [ORDER_STATES.PACKED]: "Packed",
    [ORDER_STATES.SHIPPED]: "Shipped",
    [ORDER_STATES.IN_TRANSIT]: "In Transit",
    [ORDER_STATES.OUT_FOR_DELIVERY]: "Out for Delivery",
    [ORDER_STATES.DELIVERED]: "Delivered",
    [ORDER_STATES.CANCELLED]: "Cancelled",
    [ORDER_STATES.RETURNED]: "Returned",
  };
  return labels[state] || state;
}

/**
 * Map legacy status to new state (for migration)
 */
export function mapLegacyStatus(legacyStatus: string): OrderState {
  const mapping: Record<string, OrderState> = {
    new: ORDER_STATES.CREATED,
    pending: ORDER_STATES.PENDING_CONFIRMATION,
    confirmed: ORDER_STATES.CONFIRMED,
    processing: ORDER_STATES.PROCESSING,
    packed: ORDER_STATES.PACKED,
    shipped: ORDER_STATES.SHIPPED,
    in_transit: ORDER_STATES.IN_TRANSIT,
    out_for_delivery: ORDER_STATES.OUT_FOR_DELIVERY,
    delivered: ORDER_STATES.DELIVERED,
    cancelled: ORDER_STATES.CANCELLED,
    returned: ORDER_STATES.RETURNED,
  };
  return mapping[legacyStatus] || ORDER_STATES.CREATED;
}