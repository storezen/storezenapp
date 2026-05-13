import { type Request, type Response } from "express";
import { z } from "zod";
import { recordAbandonedSnapshot } from "../services/abandoned-cart.service";
import { getAbandonedCarts, recoverCart } from "../repositories/abandoned-carts.repository";

const abandonSchema = z.object({
  storeId: z.string().uuid(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        name: z.string().min(1),
        price: z.coerce.number().nonnegative(),
        qty: z.coerce.number().int().positive(),
        variantId: z.string().optional(),
      }),
    )
    .min(1),
  customerName: z.string().max(255).optional(),
  customerPhone: z.string().min(7).max(50).optional(),
});

export async function abandonCartController(req: Request, res: Response) {
  try {
    const parsed = abandonSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const { storeId, items, customerName, customerPhone } = parsed.data;
    if (!customerPhone) return res.status(400).json({ error: "customerPhone is required for recovery" });
    const row = await recordAbandonedSnapshot({ storeId, items, customerName, customerPhone });
    return res.status(201).json({ id: row?.id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to save";
    return res.status(500).json({ error: msg });
  }
}

export async function listAbandonedCartsController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const carts = await getAbandonedCarts(req.user.storeId);
    return res.json({ carts });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch carts";
    return res.status(500).json({ error: msg });
  }
}

export async function recoverAbandonedCartController(req: Request, res: Response) {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id as string;
    await recoverCart(id);
    return res.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to recover cart";
    return res.status(500).json({ error: msg });
  }
}
