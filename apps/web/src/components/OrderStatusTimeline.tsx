"use client";

import { CheckCircle2, MapPin, Package, Sparkles, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const steps = [
  { key: "placed", label: "Placed", Icon: Package },
  { key: "confirmed", label: "Confirmed", Icon: CheckCircle2 },
  { key: "shipped", label: "Shipped", Icon: Truck },
  { key: "out_for_delivery", label: "Out for delivery", Icon: MapPin },
  { key: "delivered", label: "Delivered", Icon: Sparkles },
] as const;

type Props = {
  currentStep: string;
};

export function OrderStatusTimeline({ currentStep }: Props) {
  const normalized =
    currentStep === "new" || currentStep === "pending"
      ? "placed"
      : currentStep === "cancelled"
        ? "placed"
        : currentStep;
  let currentIndex = steps.findIndex((s) => s.key === normalized);
  if (currentIndex < 0) currentIndex = 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 md:p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Shipment progress</p>

      {/* Mobile: vertical stack */}
      <ol className="space-y-0 md:hidden">
        {steps.map((step, index) => {
          const done = index <= currentIndex;
          const active = index === currentIndex;
          const Icon = step.Icon;
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{ scale: active ? 1.05 : 1 }}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                    done ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-200 bg-white text-zinc-400",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </motion.div>
                {index < steps.length - 1 ? (
                  <div
                    className={cn("my-1 min-h-[16px] w-0.5 flex-1", index < currentIndex ? "bg-emerald-500" : "bg-zinc-200")}
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className="pb-6 pt-1.5">
                <p className={cn("text-sm font-semibold", done ? "text-emerald-900" : "text-zinc-500")}>{step.label}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Desktop: icons with flex connectors (no horizontal scroll) */}
      <div className="hidden w-full items-center md:flex">
        {steps.map((step, index) => {
          const done = index <= currentIndex;
          const active = index === currentIndex;
          const Icon = step.Icon;
          return (
            <div key={step.key} className="contents">
              {index > 0 ? (
                <div
                  className={cn("h-0.5 min-w-[8px] flex-1 rounded-full", currentIndex >= index ? "bg-emerald-500" : "bg-zinc-200")}
                  aria-hidden
                />
              ) : null}
              <div className="flex w-[4.5rem] shrink-0 flex-col items-center sm:w-[5.5rem]">
                <motion.div
                  initial={false}
                  animate={{ scale: active ? 1.06 : 1 }}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-sm",
                    done ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-200 bg-white text-zinc-400",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </motion.div>
                <p className={cn("mt-3 text-center text-xs font-semibold leading-tight", done ? "text-emerald-900" : "text-zinc-500")}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
