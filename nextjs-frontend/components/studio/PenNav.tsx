"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  Contact,
  CreditCard,
  Home,
  Image as ImageIcon,
  LayoutTemplate,
  ShieldCheck,
  Sparkles,
  Store,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    label: "Schedule",
    items: [
      { href: "/studio", label: "Home", icon: Home },
      { href: "/studio/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/studio/hours", label: "Business Hours", icon: Clock },
      { href: "/studio/contacts", label: "Contacts", icon: Contact },
    ],
  },
  {
    label: "Your Page",
    items: [
      { href: "/studio/portfolio", label: "Portfolio", icon: ImageIcon },
      { href: "/studio/flash", label: "Flash Editor", icon: Sparkles },
      { href: "/studio/merch", label: "Merchandise Shop", icon: Store },
      { href: "/studio/booking-page", label: "Booking Page Editor", icon: LayoutTemplate },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/studio/membership", label: "Membership", icon: CreditCard },
      { href: "/studio/profile", label: "Artist Profile", icon: User },
      { href: "/studio/security", label: "Account & Security", icon: ShieldCheck },
    ],
  },
];

/** A tattoo machine that physically sweeps across and draws the line on open. */
function MachineIcon({ open, reduce }: { open: boolean; reduce: boolean | null }) {
  const sweep = reduce ? 0 : 26;
  const transition = reduce
    ? { duration: 0 }
    : { duration: 0.6, ease: "easeInOut" as const };
  return (
    <svg
      width="42"
      height="46"
      viewBox="0 0 52 46"
      fill="none"
      aria-hidden="true"
      className="text-foreground"
    >
      {/* the line the machine draws, traced by the needle as it travels */}
      <motion.line
        x1="13"
        y1="38"
        x2="39"
        y2="38"
        stroke="hsl(var(--brand))"
        strokeWidth="2.8"
        strokeLinecap="round"
        initial={false}
        animate={{ pathLength: open ? 1 : 0 }}
        transition={transition}
        style={{ pathLength: open ? 1 : 0 }}
      />
      {/* the machine — moves right as the line draws */}
      <motion.g
        initial={false}
        animate={{ x: open ? sweep : 0 }}
        transition={transition}
        className="origin-bottom"
      >
        <g
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* elongated cylinder body: top rim ellipse + straight sides + rounded base */}
          <ellipse cx="13" cy="5.5" rx="5.6" ry="2.1" />
          <path d="M7.4 5.5 V24 Q7.4 27 10 27 H16 Q18.6 27 18.6 24 V5.5" />
          {/* horizontal grip line across the middle */}
          <line x1="7.9" y1="16.5" x2="18.1" y2="16.5" />
          {/* round sparkle stamp on the body */}
          <circle cx="13" cy="10.6" r="3.4" />
          {/* cartridge */}
          <path d="M10 27 L16 27 L14.5 32 L11.5 32 Z" />
          {/* needle */}
          <line x1="13" y1="32" x2="13" y2="36.5" strokeWidth="1.3" />
        </g>
        {/* brand-colored sparkle inside the stamp */}
        <path
          d="M13 8 C 13.35 10, 13.8 10.45, 15.8 10.6 C 13.8 10.75, 13.35 11.2, 13 13.2 C 12.65 11.2, 12.2 10.75, 10.2 10.6 C 12.2 10.45, 12.65 10, 13 8 Z"
          fill="hsl(var(--brand))"
        />
      </motion.g>
    </svg>
  );
}

export function PenNav() {
  const [open, setOpen] = useState(false);
  const [openCats, setOpenCats] = useState<Set<string>>(
    new Set(CATEGORIES.map((c) => c.label)),
  );
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleCat = (label: string) =>
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Open studio menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className="group flex items-center rounded-lg p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MachineIcon open={open} reduce={reduce} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl"
        >
          {CATEGORIES.map((cat) => {
            const isOpen = openCats.has(cat.label);
            return (
              <div key={cat.label} className="mb-0.5">
                <button
                  onClick={() => toggleCat(cat.label)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-bold uppercase tracking-wide text-brand hover:bg-brand-soft/60"
                >
                  {cat.label}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-brand transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                {isOpen && (
                  <ul className="mb-1 mt-0.5">
                    {cat.items.map(({ href, label, icon: Icon }) => {
                      const active =
                        href === "/studio"
                          ? pathname === "/studio"
                          : pathname.startsWith(href);
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-accent",
                              active && "bg-brand-soft font-medium text-brand",
                            )}
                          >
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            {label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
