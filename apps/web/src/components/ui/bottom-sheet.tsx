"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showHandle?: boolean;
};

export function BottomSheet({ open, onClose, title, children, className, showHandle = true }: SheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-[65] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl",
              className,
            )}
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {showHandle && (
              <div className="sticky top-0 z-10 flex justify-center bg-white/95 pt-4 pb-2 backdrop-blur-xl">
                <div className="h-1 w-12 rounded-full bg-zinc-300" />
              </div>
            )}
            <div className="px-5 pb-8">
              {title && (
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-bold text-zinc-900">{title}</h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              )}
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
