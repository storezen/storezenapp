import { Router } from "express";
import { sendMessage } from "@storepk/whatsapp";
import { normalizePhoneDigits, processOrderConfirmationReply } from "../services/orders.service";

const router = Router();

router.post("/webhooks/whatsapp", async (req, res) => {
  try {
    const configuredSecret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();
    if (configuredSecret) {
      const headerToken =
        req.header("x-webhook-secret")?.trim() ??
        req.header("x-ultramsg-token")?.trim() ??
        "";
      const bodyToken = String((req.body as Record<string, unknown>)?.token ?? "").trim();
      const provided = headerToken || bodyToken;
      if (!provided || provided !== configuredSecret) {
        return res.status(200).json({ ok: true, skipped: true });
      }
    }

    const payload = req.body as Record<string, unknown>;
    const phoneRaw =
      (payload.from as string | undefined) ??
      ((payload.data as Record<string, unknown> | undefined)?.from as string | undefined) ??
      "";
    const bodyRaw =
      (payload.body as string | undefined) ??
      (payload.message as string | undefined) ??
      ((payload.data as Record<string, unknown> | undefined)?.body as string | undefined) ??
      "";

    const phone = String(phoneRaw).trim().split("@")[0]?.trim() ?? "";
    const body = String(bodyRaw).trim();
    if (!phone || !body) return res.status(200).json({ ok: true, skipped: true });

    const phoneForState = normalizePhoneDigits(phone) || phone;
    const result = await processOrderConfirmationReply(phoneForState, body);
    if (result.invalid && result.storePayload?.whatsappInstanceId && result.storePayload?.whatsappToken) {
      await sendMessage(
        result.orderPayload.customerPhone,
        "Invalid reply. Please reply with 1 to confirm or 2 to cancel your order.",
        result.storePayload.whatsappInstanceId,
        result.storePayload.whatsappToken,
      );
    }
    return res.status(200).json({ ok: true, handled: result.handled ?? false });
  } catch {
    return res.status(200).json({ ok: true });
  }
});

export default router;
