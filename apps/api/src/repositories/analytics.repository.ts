import { and, count, desc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db";
import { marketingCampaignsTable, ordersTable, storeAnalyticsDailyTable } from "../db/schema";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function listRecordedAnalyticsDays(storeId: string, fromDay: string, toDay: string) {
  return db
    .select()
    .from(storeAnalyticsDailyTable)
    .where(
      and(
        eq(storeAnalyticsDailyTable.storeId, storeId),
        gte(storeAnalyticsDailyTable.day, fromDay),
        lte(storeAnalyticsDailyTable.day, toDay),
      ),
    )
    .orderBy(storeAnalyticsDailyTable.day);
}

type OrderDay = { day: string; ordersPlaced: number; revenue: number };

export async function getOrdersPerDay(storeId: string, from: Date, to: Date): Promise<OrderDay[]> {
  const toExclusive = new Date(to);
  toExclusive.setDate(toExclusive.getDate() + 1);
  toExclusive.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      day: sql<string>`to_char((${ordersTable.createdAt}) at time zone 'UTC', 'YYYY-MM-DD')`.as("day"),
      ordersPlaced: sql<number>`count(*)::int`.as("c"),
      revenue: sql<string>`coalesce(sum(${ordersTable.total}::numeric),0)::text`.as("rev"),
    })
    .from(ordersTable)
    .where(and(eq(ordersTable.storeId, storeId), gte(ordersTable.createdAt, from), lt(ordersTable.createdAt, toExclusive)))
    .groupBy(sql`to_char((${ordersTable.createdAt}) at time zone 'UTC', 'YYYY-MM-DD')`)
    .orderBy(sql`1`);

  return rows.map((r) => ({
    day: r.day,
    ordersPlaced: r.ordersPlaced,
    revenue: Number(r.revenue ?? 0),
  }));
}

/**
 * Cohort: first-purchase month (last 6 months) from order rows.
 */
export async function getCohortByFirstPurchaseMonth(storeId: string) {
  const since = new Date();
  since.setMonth(since.getMonth() - 6);
  const rows = await db
    .select({ customerPhone: ordersTable.customerPhone, createdAt: ordersTable.createdAt })
    .from(ordersTable)
    .where(and(eq(ordersTable.storeId, storeId), gte(ordersTable.createdAt, since)));

  const first = new Map<string, Date>();
  for (const r of rows) {
    if (!r.createdAt) continue;
    const t = new Date(r.createdAt);
    const ex = first.get(r.customerPhone);
    if (!ex || t < ex) first.set(r.customerPhone, t);
  }
  const byMonth = new Map<string, number>();
  for (const d of first.values()) {
    const m = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    byMonth.set(m, (byMonth.get(m) ?? 0) + 1);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, newBuyers]) => ({ month, newBuyers }));
}

/** Share of customers (by phone) with more than one order, lookback window. */
export async function getRepeatPurchaseStats(storeId: string, lookbackDays: number) {
  const since = daysAgo(lookbackDays);
  const rows = await db
    .select({
      customerPhone: ordersTable.customerPhone,
      n: count(),
    })
    .from(ordersTable)
    .where(and(eq(ordersTable.storeId, storeId), gte(ordersTable.createdAt, since)))
    .groupBy(ordersTable.customerPhone);
  if (rows.length === 0) {
    return { totalCustomers: 0, repeaters: 0, repeatRate: 0 };
  }
  const repeaters = rows.filter((r) => r.n > 1).length;
  return {
    totalCustomers: rows.length,
    repeaters,
    repeatRate: rows.length > 0 ? repeaters / rows.length : 0,
  };
}

function estimateFunnel(orders: number, day: string) {
  const h = (day + "funnel").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const sessions = Math.max(orders * (12 + (h % 18)), orders > 0 ? 20 : 0);
  const productViews = Math.round(sessions * (1.1 + (h % 20) / 100));
  const addToCarts = Math.round(sessions * (0.08 + (h % 15) / 200));
  const checkouts = Math.max(orders, Math.round(addToCarts * 0.45));
  return { sessions, productViews, addToCarts, checkouts };
}

export type AnalyticsDayRow = {
  day: string;
  sessions: number;
  productViews: number;
  addToCarts: number;
  checkouts: number;
  ordersPlaced: number;
  revenue: number;
  source: "recorded" | "estimated";
};

export async function buildStoreAnalytics(
  storeId: string,
  dayCount: number,
): Promise<{
  days: AnalyticsDayRow[];
  summary: {
    rangeDays: number;
    sessions: number;
    productViews: number;
    addToCarts: number;
    checkouts: number;
    ordersPlaced: number;
    revenue: number;
    orderConversion: number;
    addToCartRate: number;
    checkoutConversion: number;
    dataSource: "recorded" | "mixed" | "estimated";
  };
  repeatPurchase: { totalCustomers: number; repeaters: number; repeatRate: number; lookbackDays: number };
  cohorts: { month: string; newBuyers: number }[];
}> {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setDate(from.getDate() - (dayCount - 1));
  from.setHours(0, 0, 0, 0);
  const fromKey = dayKey(from);
  const toKey = dayKey(to);

  const [recorded, orderDays, repeat] = await Promise.all([
    listRecordedAnalyticsDays(storeId, fromKey, toKey),
    getOrdersPerDay(storeId, from, to),
    getRepeatPurchaseStats(storeId, 90),
  ]);
  const cohorts = await getCohortByFirstPurchaseMonth(storeId);

  const recMap = new Map(recorded.map((r) => [r.day, r]));
  const ordMap = new Map(orderDays.map((o) => [o.day, o]));

  const out: AnalyticsDayRow[] = [];
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const key = dayKey(d);
    if (key > toKey) break;
    const rec = recMap.get(key);
    const ord = ordMap.get(key);
    const ordersPlaced = ord?.ordersPlaced ?? Number(rec?.ordersPlaced ?? 0);
    const revenue = ord?.revenue ?? Number(rec?.revenue ?? 0);

    if (rec) {
      out.push({
        day: key,
        sessions: rec.sessions ?? 0,
        productViews: rec.productViews ?? 0,
        addToCarts: rec.addToCarts ?? 0,
        checkouts: rec.checkouts ?? 0,
        ordersPlaced,
        revenue,
        source: "recorded",
      });
    } else {
      const est = estimateFunnel(ordersPlaced, key);
      out.push({
        day: key,
        ...est,
        ordersPlaced,
        revenue,
        source: "estimated",
      });
    }
  }

  const sumSessions = out.reduce((s, x) => s + x.sessions, 0);
  const sumViews = out.reduce((s, x) => s + x.productViews, 0);
  const sumCarts = out.reduce((s, x) => s + x.addToCarts, 0);
  const sumCheckouts = out.reduce((s, x) => s + x.checkouts, 0);
  const sumOrders = out.reduce((s, x) => s + x.ordersPlaced, 0);
  const sumRevenue = out.reduce((s, x) => s + x.revenue, 0);
  const hasRec = out.some((x) => x.source === "recorded");
  const hasEst = out.some((x) => x.source === "estimated");
  const dataSource = hasRec && hasEst ? "mixed" : hasRec ? "recorded" : "estimated";

  return {
    days: out,
    summary: {
      rangeDays: dayCount,
      sessions: sumSessions,
      productViews: sumViews,
      addToCarts: sumCarts,
      checkouts: sumCheckouts,
      ordersPlaced: sumOrders,
      revenue: sumRevenue,
      orderConversion: sumSessions > 0 ? sumOrders / sumSessions : 0,
      addToCartRate: sumSessions > 0 ? sumCarts / sumSessions : 0,
      checkoutConversion: sumCarts > 0 ? sumCheckouts / sumCarts : 0,
      dataSource,
    },
    repeatPurchase: { ...repeat, lookbackDays: 90 },
    cohorts,
  };
}

export function listCampaignsByStore(storeId: string) {
  return db
    .select()
    .from(marketingCampaignsTable)
    .where(eq(marketingCampaignsTable.storeId, storeId))
    .orderBy(desc(marketingCampaignsTable.createdAt));
}

export async function createCampaign(
  storeId: string,
  data: { name: string; channel?: string; status?: string; budget?: string; spend?: string; notes?: string | null },
) {
  const [row] = await db
    .insert(marketingCampaignsTable)
    .values({
      id: randomUUID(),
      storeId,
      name: data.name,
      channel: data.channel ?? "meta",
      status: data.status ?? "active",
      budget: data.budget ?? "0",
      spend: data.spend ?? "0",
    })
    .returning();
  if (data.notes != null) {
    const [u] = await db
      .update(marketingCampaignsTable)
      .set({ notes: data.notes, updatedAt: new Date() })
      .where(eq(marketingCampaignsTable.id, row.id))
      .returning();
    return u;
  }
  return row;
}

export async function updateCampaign(
  storeId: string,
  id: string,
  patch: Partial<{
    name: string;
    channel: string;
    status: string;
    budget: string;
    spend: string;
    impressions: number;
    clicks: number;
    conversions: number;
    notes: string | null;
  }>,
) {
  const [row] = await db
    .update(marketingCampaignsTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(marketingCampaignsTable.id, id), eq(marketingCampaignsTable.storeId, storeId)))
    .returning();
  return row ?? null;
}

export async function deleteCampaign(storeId: string, id: string) {
  const [row] = await db
    .delete(marketingCampaignsTable)
    .where(and(eq(marketingCampaignsTable.id, id), eq(marketingCampaignsTable.storeId, storeId)))
    .returning();
  return row ?? null;
}
