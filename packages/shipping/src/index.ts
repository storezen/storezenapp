import * as postex from "./couriers/postex";
import * as leopards from "./couriers/leopards";

type CourierName = "postex" | "leopards";

export async function bookShipping(
  courier: CourierName,
  order: {
    id: string;
    total: number | string;
    customer_phone: string;
    customer_name: string;
    customer_address: string;
    customer_city: string;
  },
  creds: { apiKey: string },
) {
  if (courier === "postex") return postex.bookShipment(order, { apiKey: creds.apiKey });
  if (courier === "leopards") return leopards.bookShipment(order, { apiKey: creds.apiKey });
  throw new Error("Unsupported courier");
}

export async function trackShipping(
  courier: CourierName,
  tracking: string,
  creds: { apiKey: string },
) {
  if (courier === "postex") return postex.trackShipment(tracking, { apiKey: creds.apiKey });
  if (courier === "leopards") return leopards.trackShipment(tracking, { apiKey: creds.apiKey });
  throw new Error("Unsupported courier");
}

export * as postex from "./couriers/postex";
export * as leopards from "./couriers/leopards";
