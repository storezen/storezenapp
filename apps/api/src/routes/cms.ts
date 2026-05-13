import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  listCmsPagesController,
  getCmsPageController,
  createCmsPageController,
  updateCmsPageController,
  deleteCmsPageController,
  publishCmsPageController,
  listCmsRevisionsController,
  restoreCmsRevisionController,
} from "../controllers/cms.controller";

const router = Router();

router.use(authenticate);

router.get("/cms/pages", listCmsPagesController);
router.post("/cms/pages", createCmsPageController);
router.get("/cms/pages/:id", getCmsPageController);
router.patch("/cms/pages/:id", updateCmsPageController);
router.delete("/cms/pages/:id", deleteCmsPageController);
router.post("/cms/pages/:id/publish", publishCmsPageController);
router.get("/cms/pages/:id/revisions", listCmsRevisionsController);
router.post("/cms/pages/:id/revisions/:revisionId/restore", restoreCmsRevisionController);

export default router;
