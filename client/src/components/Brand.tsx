import { Dumbbell } from "lucide-react";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dimensions =
    size === "lg" ? "h-20 w-20" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  return (
    <span
      aria-hidden="true"
      className={`${dimensions} inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--cm-gold)] bg-[var(--cm-surface-raised)] text-[var(--cm-gold)] shadow-[0_0_24px_rgb(212_170_64_/_0.16)]`}
    >
      <Dumbbell
        size={size === "lg" ? 30 : size === "sm" ? 16 : 20}
        strokeWidth={2.2}
      />
    </span>
  );
}

export function BrandLockup({ context }: { context?: string }) {
  return (
    <div className="flex items-center gap-3">
      <BrandMark />
      <div>
        <div className="font-['Cabinet_Grotesk'] text-sm font-extrabold tracking-[0.13em] text-[var(--cm-gold)]">
          COACH MURRAY
        </div>
        {context && (
          <div className="mt-0.5 text-xs text-[var(--cm-text-muted)]">
            {context}
          </div>
        )}
      </div>
    </div>
  );
}
