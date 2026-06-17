import { cn } from "@/lib/utils";

/**
 * FlashBook brand lockup — a coral "flash" badge (booking card + lightning bolt)
 * plus the wordmark. Pure vector mark; set `markOnly` for the badge alone.
 */
export function FlashBookLogo({
  className,
  markOnly = false,
  size = 28,
}: {
  className?: string;
  markOnly?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="FlashBook"
      >
        <rect
          x="2.5"
          y="2.5"
          width="27"
          height="27"
          rx="8"
          fill="hsl(var(--brand))"
        />
        {/* four-point sparkle */}
        <path
          d="M16 6 C 16.9 13, 19 15.1, 26 16 C 19 16.9, 16.9 19, 16 26 C 15.1 19, 13 16.9, 6 16 C 13 15.1, 15.1 13, 16 6 Z"
          fill="hsl(var(--brand-foreground))"
        />
      </svg>
      {!markOnly && (
        <span className="font-display text-xl font-semibold leading-none tracking-tight">
          Flash<span className="font-normal text-muted-foreground">Book</span>
        </span>
      )}
    </span>
  );
}
