import Link from "next/link";
import {
  eachDayOfInterval,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import {
  CalendarPlus,
  Image as ImageIcon,
  LayoutTemplate,
  Megaphone,
  Plus,
  Send,
  Sparkles,
  Store,
} from "lucide-react";

import { FlashBookLogo } from "@/components/brand/FlashBookLogo";
import { AddNewMenu } from "@/components/studio/AddNewMenu";
import { RevenueChart, type RevenuePoint } from "@/components/studio/RevenueChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";
import { fetchAppointments, fetchMyProfile } from "@/lib/studio-data";

/** A tidy, whimsical sparkle trio for the greeting. */
function SparkleBurst() {
  const star = (cx: number, cy: number, r: number) =>
    `M${cx} ${cy - r} C ${cx + r * 0.28} ${cy - r * 0.28}, ${cx + r * 0.28} ${cy - r * 0.28}, ${cx + r} ${cy} C ${cx + r * 0.28} ${cy + r * 0.28}, ${cx + r * 0.28} ${cy + r * 0.28}, ${cx} ${cy + r} C ${cx - r * 0.28} ${cy + r * 0.28}, ${cx - r * 0.28} ${cy + r * 0.28}, ${cx - r} ${cy} C ${cx - r * 0.28} ${cy - r * 0.28}, ${cx - r * 0.28} ${cy - r * 0.28}, ${cx} ${cy - r} Z`;
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="hsl(var(--brand))"
      aria-hidden="true"
    >
      <path d={star(16, 17, 9)} className="motion-safe:animate-pulse" />
      <path d={star(30, 11, 4.5)} opacity="0.85" />
      <path d={star(28, 27, 3)} opacity="0.6" />
    </svg>
  );
}

export default async function StudioHomePage() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [user, profile, weekAppts] = await Promise.all([
    getCurrentUser(),
    fetchMyProfile(),
    fetchAppointments(weekStart.toISOString(), weekEnd.toISOString()),
  ]);
  const name = user?.full_name || profile?.display_name || "there";
  const shop = profile?.business_name;

  const todays = weekAppts
    .filter((a) => {
      const s = parseISO(a.start_at);
      return s >= startOfDay(now) && s <= endOfDay(now);
    })
    .sort((a, b) => a.start_at.localeCompare(b.start_at));

  const reviewQueue = weekAppts.filter((a) => a.status === "under_review");

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const revenue: RevenuePoint[] = days.map((d) => {
    const booking = weekAppts
      .filter((a) => isSameDay(parseISO(a.start_at), d))
      .reduce((sum, a) => sum + (a.deposit_cents || 0), 0);
    return { day: format(d, "EEE"), booking: booking / 100, merch: 0 };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <SparkleBurst />
          <div>
            <p className="text-sm font-medium text-brand">Welcome back ✨</p>
            <h1 className="font-display text-3xl leading-tight">{name}</h1>
            {shop && <p className="text-sm text-muted-foreground">{shop}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddNewMenu variant="outline" />
          <Button asChild variant="outline">
            <Link href="/studio/booking-page">
              <LayoutTemplate className="mr-2 h-4 w-4" /> Booking page editor
            </Link>
          </Button>
          <Button asChild variant="brand">
            <Link href="/studio/calendar">
              <CalendarPlus className="mr-2 h-4 w-4" /> New appointment
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today */}
        <Card className="fb-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Today</CardTitle>
            <CardDescription>{format(now, "EEEE, MMMM d")}</CardDescription>
          </CardHeader>
          <CardContent>
            {todays.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <FlashBookLogo markOnly size={40} />
                <p className="text-lg font-medium">No appointment today!</p>
                <p className="text-sm text-muted-foreground">
                  Enjoy the breather — or open your calendar to add one.
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {todays.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{a.client_name ?? "Client"}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.subject ?? a.title ?? "Tattoo"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(parseISO(a.start_at), "p")}
                      </p>
                      <StatusBadge status={a.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Action items */}
        <Card className="fb-card">
          <CardHeader>
            <CardTitle className="font-display">Action items</CardTitle>
            <CardDescription>Booking requests waiting on you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">You&apos;re all caught up. 🎉</p>
            ) : (
              reviewQueue.map((a) => (
                <div
                  key={a.id}
                  className="rounded-[var(--radius)] border bg-brand-soft/40 p-3"
                >
                  <p className="text-sm font-medium">{a.client_name ?? "New request"}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.subject ?? "Tattoo"} · {format(parseISO(a.start_at), "MMM d, p")}
                  </p>
                  <Button asChild size="sm" variant="brand" className="mt-2">
                    <Link href={`/studio/calendar?appointment=${a.id}`}>
                      Review this booking request
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue */}
        <Card className="fb-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">This week</CardTitle>
            <CardDescription>Booking & merch revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenue} />
          </CardContent>
        </Card>

        {/* Quick add (was Flash occasions) */}
        <Card className="fb-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Plus className="h-4 w-4 text-brand" /> Add new
            </CardTitle>
            <CardDescription>Build out your page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickAdd href="/studio/merch" icon={Store} label="Add merch" />
            <QuickAdd href="/studio/flash" icon={Sparkles} label="Add flash" />
            <QuickAdd href="/studio/portfolio" icon={ImageIcon} label="Add to portfolio" />
            <QuickAdd href="/studio/campaigns" icon={Send} label="Add campaign" />
            <QuickAdd href="/studio/booking-page" icon={Megaphone} label="Add announcement" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickAdd({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Button asChild variant="outline" className="w-full justify-start">
      <Link href={href}>
        <Icon className="mr-2 h-4 w-4 text-brand" />
        {label}
      </Link>
    </Button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-accent-3/15 text-accent-3",
    under_review: "bg-brand-soft text-brand",
    requested: "bg-muted text-muted-foreground",
    completed: "bg-accent-3/15 text-accent-3",
    cancelled: "bg-muted text-muted-foreground line-through",
    declined: "bg-destructive/10 text-destructive",
    no_show: "bg-destructive/10 text-destructive",
  };
  return (
    <Badge variant="secondary" className={map[status] ?? ""}>
      {status.replace("_", " ")}
    </Badge>
  );
}
