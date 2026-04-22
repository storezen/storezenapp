"use client";

const steps = [
  { key: "placed", label: "Order Placed", icon: "📦" },
  { key: "confirmed", label: "Confirmed", icon: "✅" },
  { key: "shipped", label: "Shipped", icon: "🚚" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "📍" },
  { key: "delivered", label: "Delivered", icon: "🎉" },
];

type Props = {
  currentStep: string;
};

export function OrderStatusTimeline({ currentStep }: Props) {
  const currentIndex = steps.findIndex((step) => step.key === currentStep);

  return (
    <div className="overflow-auto">
      <div className="flex min-w-[620px] items-center gap-2">
        {steps.map((step, index) => {
          const done = index <= currentIndex;
          return (
            <div key={step.key} className="flex flex-1 items-center gap-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-base ${done ? "bg-success text-white" : "bg-gray-200 text-gray-600"}`}>
                {step.icon}
              </div>
              <span className={`text-xs font-semibold ${done ? "text-success" : "text-gray-500"}`}>{step.label}</span>
              {index < steps.length - 1 ? (
                <div className={`h-1 flex-1 rounded ${index < currentIndex ? "bg-success" : "bg-gray-200"}`} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
