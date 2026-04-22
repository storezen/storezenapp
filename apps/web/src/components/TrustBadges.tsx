"use client";

const BADGES = [
  { icon: "🚚", title: "Fast Delivery", subtitle: "2-4 business days" },
  { icon: "✅", title: "Cash on Delivery", subtitle: "No advance needed" },
  { icon: "🔒", title: "Secure Checkout", subtitle: "100% safe" },
  { icon: "💬", title: "WhatsApp Support", subtitle: "Always available" },
];

export function TrustBadges() {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {BADGES.map((badge) => (
        <div key={badge.title} className="rounded-md border border-border bg-white px-3 py-4 text-center">
          <div className="text-xl">{badge.icon}</div>
          <p className="mt-2 text-sm font-semibold text-[#1a1a1a]">{badge.title}</p>
          <p className="text-xs text-secondary">{badge.subtitle}</p>
        </div>
      ))}
    </section>
  );
}
