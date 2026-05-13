import { Router } from "express";
import { z } from "zod";
import { generateProductContent } from "@storepk/ai";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

const generateDescriptionSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  features: z.array(z.string()).default([]),
});

router.post("/ai/generate-description", authenticate, async (req, res) => {
  try {
    const parsed = generateDescriptionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ")  });

    const content = await generateProductContent(
      parsed.data.name,
      parsed.data.category,
      parsed.data.features,
    );
    return res.json(content);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to generate content";
    return res.status(500).json({ error: msg });
  }
});

export default router;
