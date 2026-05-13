import { Router } from "express";
import { db, storesTable } from "../db";
import { eq } from "drizzle-orm";
import { findBundlesByStoreId, findBundleItemsByBundleId, findBundleById } from "../repositories/bundles.repository";

const router = Router();

// Get public bundles by store slug
router.get("/:slug/bundles", async (req, res) => {
  try {
    const { slug } = req.params;

    const [store] = await db.select().from(storesTable).where(eq(storesTable.slug, slug)).limit(1);
    if (!store) return res.status(404).json({ error: "Store not found" });

    const bundles = await findBundlesByStoreId(store.id);

    const bundlesWithItems = await Promise.all(
      bundles
        .filter((b) => b.isActive)
        .map(async (bundle) => {
          const items = await findBundleItemsByBundleId(bundle.id);
          return {
            ...bundle,
            discountValue: Number(bundle.discountValue),
            items: items.map((item) => ({
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              name: item.name ?? "",
              price: Number(item.price ?? 0),
              salePrice: item.salePrice ? Number(item.salePrice) : null,
              images: typeof item.image === "string" ? JSON.parse(item.image) : (item.image ?? []),
            })),
          };
        })
    );

    return res.json({ bundles: bundlesWithItems });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch bundles";
    return res.status(500).json({ error: msg });
  }
});

// Get single public bundle
router.get("/:slug/bundles/:bundleId", async (req, res) => {
  try {
    const { slug, bundleId } = req.params;

    const [store] = await db.select().from(storesTable).where(eq(storesTable.slug, slug)).limit(1);
    if (!store) return res.status(404).json({ error: "Store not found" });

    const bundle = await findBundleById(bundleId);
    if (!bundle || bundle.storeId !== store.id || !bundle.isActive) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    const items = await findBundleItemsByBundleId(bundleId);

    return res.json({
      bundle: {
        ...bundle,
        discountValue: Number(bundle.discountValue),
        items: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          name: item.name ?? "",
          price: Number(item.price ?? 0),
          salePrice: item.salePrice ? Number(item.salePrice) : null,
          images: typeof item.image === "string" ? JSON.parse(item.image) : (item.image ?? []),
        })),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch bundle";
    return res.status(500).json({ error: msg });
  }
});

export default router;