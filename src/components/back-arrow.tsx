import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Elegant circled arrow used as a leading icon on back-links.
 * Inherits color from parent; uses border for the circle.
 */
export function BackArrow({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border border-current/30 transition-colors",
        className,
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.25} />
    </span>
  );
}

export function ForwardArrow({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border border-current/30 transition-colors",
        className,
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5 rotate-180" strokeWidth={1.25} />
    </span>
  );
}