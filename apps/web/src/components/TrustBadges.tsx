"use client";

const BADGES = [
  { icon: "🚚", title: "Fast Delivery", subtitle: "2-5 Business Days" },
  { icon: "💵", title: "Cash on Delivery", subtitle: "No Advance Payment" },
  { icon: "📬", title: "Parcel Open Allowed", subtitle: "Check before payment" },
  { icon: "💬", title: "WhatsApp Support", subtitle: "Always Available" },
];

export function TrustBadges() {
  return (
    <section className="grid grid-cols-2 overflow-hidden rounded-xl border border-zinc-200 bg-white md:grid-cols-4">
      {BADGES.map((badge) => (
        <div key={badge.title} className="border-r border-zinc-200 px-3 py-5 text-center last:border-r-0">
          <div className="text-xl">{badge.icon}</div>
          <p className="mt-2 text-sm font-semibold text-zinc-900">{badge.title}</p>
          <p className="text-xs text-zinc-500">{badge.subtitle}</p>
        </div>
      ))}
    </section>
  );
}
