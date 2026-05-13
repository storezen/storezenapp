import { type Request, type Response } from "express";
import { findOrderById, getCustomerAggregatesForStore } from "../repositories/orders.repository";
import {
  exportCSV,
  listStoreOrders,
  placeOrder,
  trackOrder,
  updateStatus,
  getOrderEventHistory,
} from "../services/orderService";
import {
  bulkStatusSchema,
  listOrdersQuerySchema,
  placeOrderSchema,
  trackOrderQuerySchema,
  updateOrderStatusSchema,
} from "../validators/orders.validator";

function toSingleParam(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] : value;
}

export async function placeOrderController(req: Request, res: Response) {
  try {
    const parsed = placeOrderSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const body = parsed.data;
    const refCode = typeof req.cookies?.ref_code === "string" ? req.cookies.ref_code : undefined;

    const order = await placeOrder({
      storeId: body.storeId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerCity: body.customerCity,
      customerAddress: body.customerAddress,
      items: body.items ?? [],
      paymentMethod: body.paymentMethod,
      couponCode: body.couponCode,
      notes: body.notes,
      refCode,
    });
    return res.status(201).json(order);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to place order";
    if (msg.includes("Insufficient stock") || msg.includes("Product not found") || msg.includes("at least one item")) {
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: msg });
  }
}

export async function getOrdersController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = listOrdersQuerySchema.safeParse(req.query);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const { status, page, pageSize, search } = parsed.data;
    const result = await listStoreOrders(req.user.storeId, {
      status,
      search,
      page: page ?? 1,
      pageSize,
    });
    return res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load orders";
    return res.status(500).json({ error: msg });
  }
}

export async function getOrderByIdController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const orderId = toSingleParam(req.params.id);
    const order = await findOrderById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.storeId !== req.user.storeId) return res.status(403).json({ error: "Forbidden" });
    return res.json(order);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch order";
    return res.status(500).json({ error: msg });
  }
}

export async function updateOrderStatusController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = updateOrderStatusSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const { status } = parsed.data;
    const orderId = toSingleParam(req.params.id);
    const order = await updateStatus(orderId, status, req.user.storeId);
    return res.json(order);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update order";
    if (msg === "NotFound") return res.status(404).json({ error: "Order not found" });
    if (msg === "Forbidden") return res.status(403).json({ error: "Forbidden" });
    if (msg === "InvalidStatusTransition") return res.status(400).json({ error: "Invalid status transition" });
    return res.status(500).json({ error: msg });
  }
}

export async function trackOrderController(req: Request, res: Response) {
  try {
    const parsed = trackOrderQuerySchema.safeParse(req.query);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const order = await trackOrder(parsed.data.id, parsed.data.phone);
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(order);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to track order";
    if (msg === "orderId or phone is required") return res.status(400).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function exportOrdersController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const csv = await exportCSV(req.user.storeId);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
    return res.status(200).send(csv);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to export orders";
    return res.status(500).json({ error: msg });
  }
}

export async function bulkStatusController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = bulkStatusSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const { ids, status } = parsed.data;

    const updated = [];
    for (const id of ids) {
      updated.push(await updateStatus(id, status, req.user.storeId));
    }
    return res.json({ updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to bulk update order status";
    if (msg === "NotFound") return res.status(404).json({ error: "Order not found" });
    if (msg === "Forbidden") return res.status(403).json({ error: "Forbidden" });
    if (msg === "InvalidStatusTransition") return res.status(400).json({ error: "Invalid status transition" });
    return res.status(500).json({ error: msg });
  }
}

export async function getCustomersAggregateController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const customers = await getCustomerAggregatesForStore(req.user.storeId);
    return res.json({ customers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load customers";
    return res.status(500).json({ error: msg });
  }
}

function escCsv(s: string) {
  return `"${String(s).replace(/"/g, '""')}"`;
}

export async function getCustomersExportController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const list = await getCustomerAggregatesForStore(req.user.storeId);
    const header = ["Name", "Phone", "City (last order)", "Orders", "Last order (UTC)", "Total spent (PKR)"];
    const lines = [header.map(escCsv).join(",")];
    for (const c of list) {
      lines.push(
        [
          c.displayName,
          c.customerPhone,
          c.lastCity,
          String(c.orderCount),
          c.lastOrderAt,
          String(c.totalSpent),
        ]
          .map(escCsv)
          .join(","),
      );
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=customers.csv");
    return res.status(200).send(lines.join("\n"));
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to export customers";
    return res.status(500).json({ error: msg });
  }
}

// Get order event history (timeline)
export async function getOrderEventsController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const orderId = toSingleParam(req.params.id);

    // Verify order belongs to store
    const order = await findOrderById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.storeId !== req.user.storeId) return res.status(403).json({ error: "Forbidden" });

    const events = await getOrderEventHistory(orderId);
    return res.json({ events });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load order events";
    return res.status(500).json({ error: msg });
  }
}

