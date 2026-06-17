"use client";

import Link from "next/link";
import {
  Image as ImageIcon,
  Megaphone,
  Plus,
  Send,
  Sparkles,
  Store,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEMS = [
  { href: "/studio/merch", label: "Merch", icon: Store },
  { href: "/studio/booking-page", label: "Announcement", icon: Megaphone },
  { href: "/studio/campaigns", label: "Campaign", icon: Send },
  { href: "/studio/portfolio", label: "Portfolio Image", icon: ImageIcon },
  { href: "/studio/flash", label: "Flash Piece", icon: Sparkles },
];

export function AddNewMenu({
  variant = "brand",
}: {
  variant?: "brand" | "outline";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant}>
          <Plus className="mr-1.5 h-4 w-4" /> Add New
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-popover">
        <DropdownMenuLabel>Create</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem key={label} asChild>
            <Link href={href} className="flex cursor-pointer items-center gap-2.5">
              <Icon className="h-4 w-4 text-brand" aria-hidden="true" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
