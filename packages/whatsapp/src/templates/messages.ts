type TemplateVars = Record<string, string | number | undefined>;

function value(vars: TemplateVars, key: string, fallback = "") {
  return String(vars[key] ?? fallback);
}

export const MESSAGES = {
  ORDER_RECEIVED: (vars: TemplateVars) =>
    `Assalam o Alaikum ${value(vars, "name")}! Order #${value(vars, "id")} receive hua. Total: Rs.${value(vars, "total")}. Confirm: 1, Cancel: 2`,
  ORDER_CONFIRMED: (vars: TemplateVars) =>
    `Shukriya ${value(vars, "name")}! Aapka order #${value(vars, "id")} confirm ho gaya hai. Total: Rs.${value(vars, "total")}.`,
  ORDER_CANCELLED: (vars: TemplateVars) =>
    `Assalam o Alaikum ${value(vars, "name")}, aapka order #${value(vars, "id")} cancel kar diya gaya hai. Agar dubara order karna ho to reply karein.`,
  PICKED_UP: (vars: TemplateVars) =>
    `Update: Order #${value(vars, "id")} rider ne pick kar liya hai. ${value(vars, "store_name", "Store")} se dispatch ho chuka hai.`,
  OUT_FOR_DELIVERY: (vars: TemplateVars) =>
    `Order #${value(vars, "id")} out for delivery hai. ${value(vars, "name")} kindly phone available rakhein.`,
  DELIVERED: (vars: TemplateVars) =>
    `Alhamdulillah! Order #${value(vars, "id")} delivered. JazakAllah ${value(vars, "name")} for shopping with ${value(vars, "store_name", "us")}.`,
  NEW_ORDER_ALERT: (vars: TemplateVars) =>
    `New order alert! #${value(vars, "id")} from ${value(vars, "name")} (${value(vars, "phone")}). Total: Rs.${value(vars, "total")}.`,
  DAILY_REPORT: (vars: TemplateVars) =>
    `Daily report (${value(vars, "date")}): Orders ${value(vars, "orders")}, Delivered ${value(vars, "delivered")}, Revenue Rs.${value(vars, "revenue")}.`,
  ABANDONED_CART: (vars: TemplateVars) =>
    `Assalam o Alaikum ${value(vars, "name")}! Aap ne cart chhor di: ${value(vars, "summary")}. ${value(
      vars,
      "store_name",
      "Store",
    )} se order complete karna ho to yahi number par message karein — COD available.`,
};

export type MessageKey = keyof typeof MESSAGES;
