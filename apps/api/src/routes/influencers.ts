import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { db, influencersTable } from "../db";

const router = Router();

function toSingleParam(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] : value;
}

function makeRefCode(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 8) || "ref";
  return `${base}${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
}

router.post("/influencers", authenticate, async (req, res) => {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const { name, phone, email, commissionPercent } = req.body as {
      name?: string;
      phone?: string;
      email?: string;
      commissionPercent?: number;
    };
    if (!name) return res.status(400).json({ error: "name is required" });
    const influencer = await db
      .insert(influencersTable)
      .values({
        id: randomUUID(),
        storeId: req.user.storeId,
        name,
        phone: phone ?? null,
        email: email ?? null,
        refCode: makeRefCode(name),
        commissionPercent: String(commissionPercent ?? 10),
      })
      .returning();
    return res.status(201).json(influencer[0]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create influencer";
    return res.status(500).json({ error: msg });
  }
});

router.get("/influencers", authenticate, async (req, res) => {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const rows = await db.select().from(influencersTable).where(eq(influencersTable.storeId, req.user.storeId));
    return res.json({ influencers: rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load influencers";
    return res.status(500).json({ error: msg });
  }
});

router.put("/influencers/:id", authenticate, async (req, res) => {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = toSingleParam(req.params.id);
    const patch = req.body as Record<string, unknown>;
    const [updated] = await db
      .update(influencersTable)
      .set({
        name: typeof patch.name === "string" ? patch.name : undefined,
        phone: typeof patch.phone === "string" ? patch.phone : undefined,
        email: typeof patch.email === "string" ? patch.email : undefined,
        commissionPercent:
          patch.commissionPercent != null ? String(Number(patch.commissionPercent)) : undefined,
        isActive: typeof patch.isActive === "boolean" ? patch.isActive : undefined,
      })
      .where(and(eq(influencersTable.id, id), eq(influencersTable.storeId, req.user.storeId)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Influencer not found" });
    return res.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update influencer";
    return res.status(500).json({ error: msg });
  }
});

router.put("/influencers/:id/payout", authenticate, async (req, res) => {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = toSingleParam(req.params.id);
    const [current] = await db
      .select()
      .from(influencersTable)
      .where(and(eq(influencersTable.id, id), eq(influencersTable.storeId, req.user.storeId)))
      .limit(1);
    if (!current) return res.status(404).json({ error: "Influencer not found" });
    const [updated] = await db
      .update(influencersTable)
      .set({ totalCommission: "0" })
      .where(and(eq(influencersTable.id, id), eq(influencersTable.storeId, req.user.storeId)))
      .returning();
    return res.json({ influencer: updated, paidAmount: Number(current.totalCommission ?? 0) });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to mark payout";
    return res.status(500).json({ error: msg });
  }
});

router.delete("/influencers/:id", authenticate, async (req, res) => {
  try {
    if (!req.user?.storeId) return res.status(401).json({ error: "Unauthorized" });
    const id = toSingleParam(req.params.id);
    const [deleted] = await db
      .delete(influencersTable)
      .where(and(eq(influencersTable.id, id), eq(influencersTable.storeId, req.user.storeId)))
      .returning();
    if (!deleted) return res.status(404).json({ error: "Influencer not found" });
    return res.status(204).send();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete influencer";
    return res.status(500).json({ error: msg });
  }
});

export default router;
