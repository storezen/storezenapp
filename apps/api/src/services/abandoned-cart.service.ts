import { randomUUID } from "node:crypto";
import { sendAbandonedCartReminder } from "@storepk/whatsapp";
import { insertAbandonedCart, listDueForReminder, markRecoveredByPhone, markReminderSent } from "../repositories/abandoned-carts.repository";
import { findStoreById } from "../repositories/stores.repository";

type CartItem = { product_id: string; name: string; price: number; qty: number; variantId?: string };

export async function recordAbandonedSnapshot(input: {
  storeId: string;
  items: CartItem[];
  customerName?: string;
  customerPhone?: string;
}) {
  if (input.items.length === 0) return null;
  return insertAbandonedCart({
    id: randomUUID(),
    storeId: input.storeId,
    items: input.items,
    customerName: input.customerName ?? null,
    customerPhone: input.customerPhone ?? null,
    recovered: false,
    source: "web",
  });
}

export function summarizeItems(items: CartItem[]) {
  return items
    .slice(0, 4)
    .map((i) => `${i.name} x${i.qty}`)
    .join(", ");
}

export async function processAbandonedCartReminders() {
  const due = await listDueForReminder({ olderThanMinutes: 90, limit: 25 });
  for (const row of due) {
    const phone = row.customerPhone?.trim();
    if (!phone) continue;
    const store = await findStoreById(row.storeId);
    if (!store?.whatsappInstance || !store.whatsappApiKey) {
      await markReminderSent(row.id);
      continue;
    }
    const items = (row.items as CartItem[]) ?? [];
    const summary = summarizeItems(items);
    try {
      await sendAbandonedCartReminder(
        {
          id: row.id,
          customerName: row.customerName ?? undefined,
          customerPhone: phone,
          summary: summary || "Items in cart",
        },
        {
          id: store.id,
          name: store.name,
          ownerPhone: store.whatsappNumber ?? undefined,
          whatsappInstanceId: store.whatsappInstance ?? undefined,
          whatsappToken: store.whatsappApiKey ?? undefined,
        },
      );
    } catch {
      // do not mark sent if throw
    }
    await markReminderSent(row.id);
  }
}

export function markCartsRecoveredForOrder(storeId: string, customerPhone: string) {
  return markRecoveredByPhone(storeId, customerPhone);
}
