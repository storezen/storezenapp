import { Router, type Request, type Response, type NextFunction } from "express";
import { cmsRepository } from "../repositories/cms.repository";
import { findStoreBySlug } from "../repositories/stores.repository";
import { toParam } from "../controllers/cms.controller";

const storeCmsRouter = Router({ mergeParams: true });

storeCmsRouter.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeSlug = toParam(req.params.storeSlug);
    const slug = toParam(req.params.slug);

    if (!storeSlug || !slug) {
      res.status(400).json({ error: "Missing store or page slug" });
      return;
    }

    const store = await findStoreBySlug(storeSlug);
    if (!store) {
      res.status(404).json({ error: "Store not found" });
      return;
    }

    const page = await cmsRepository.findPublishedPageBySlug(store.id, slug);
    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }

    res.json(page);
  } catch (err) {
    next(err);
  }
});

storeCmsRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeSlug = toParam(req.params.storeSlug);

    if (!storeSlug) {
      res.status(400).json({ error: "Missing store slug" });
      return;
    }

    const store = await findStoreBySlug(storeSlug);
    if (!store) {
      res.status(404).json({ error: "Store not found" });
      return;
    }

    const pages = await cmsRepository.listPagesByStore(store.id, { includeUnpublished: false });

    res.json({ pages });
  } catch (err) {
    next(err);
  }
});

export default storeCmsRouter;