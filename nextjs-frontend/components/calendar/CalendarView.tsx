"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import {
  NewAppointmentDialog,
  AppointmentDetailDialog,
} from "@/components/calendar/AppointmentDialogs";
import { Button } from "@/components/ui/button";
import {
  type Appt,
  type CalView,
  HOUR_PX,
  STATUS_STYLES,
  hoursAxis,
  layoutDay,
  viewRange,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

export function CalendarView({
  appts,
  view,
  dateISO,
  depositDefaultCents,
  selectedId,
}: {
  appts: Appt[];
  view: CalView;
  dateISO: string;
  depositDefaultCents: number;
  selectedId?: string;
}) {
  const router = useRouter();
  const anchor = useMemo(() => parseISO(dateISO), [dateISO]);
  const [newStart, setNewStart] = useState<Date | null>(null);
  const [detail, setDetail] = useState<Appt | null>(null);
  // "Today" depends on the client clock/timezone — only highlight after mount to
  // avoid a server/client hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (selectedId) {
      const found = appts.find((a) => a.id === selectedId);
      if (found) setDetail(found);
    }
  }, [selectedId, appts]);

  const navigate = (v: CalView, d: Date) =>
    router.push(`/studio/calendar?view=${v}&date=${format(d, "yyyy-MM-dd")}`);

  const step = (dir: number) => {
    if (view === "day") navigate("day", addDays(anchor, dir));
    else if (view === "week") navigate("week", addWeeks(anchor, dir));
    else navigate("month", addMonths(anchor, dir));
  };

  const { start, end } = viewRange(view, anchor);
  const label =
    view === "month"
      ? format(anchor, "MMMM yyyy")
      : view === "day"
        ? format(anchor, "EEEE, MMMM d")
        : `${format(start, "MMM d")} – ${format(end, "MMM d")}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex rounded-button border p-0.5">
            {(["day", "week", "month"] as CalView[]).map((v) => (
              <button
                key={v}
                onClick={() => navigate(v, anchor)}
                className={cn(
                  "rounded-[calc(var(--button-radius)-2px)] px-3 py-1 text-sm capitalize",
                  view === v
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" aria-label="Previous" onClick={() => step(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(view, new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" aria-label="Next" onClick={() => step(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="font-display text-xl">{label}</h2>
        </div>
        <Button
          variant="brand"
          onClick={() => setNewStart(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), 12, 0))}
        >
          <Plus className="mr-1 h-4 w-4" /> New
        </Button>
      </div>

      {view === "month" ? (
        <MonthGrid
          anchor={anchor}
          appts={appts}
          showToday={mounted}
          onPickDay={(d) => navigate("day", d)}
        />
      ) : (
        <TimeGrid
          days={
            view === "day"
              ? [anchor]
              : eachDayOfInterval({ start, end: addDays(start, 6) })
          }
          appts={appts}
          showToday={mounted}
          onEmptyClick={(d) => setNewStart(d)}
          onApptClick={(a) => setDetail(a)}
        />
      )}

      {newStart && (
        <NewAppointmentDialog
          open={!!newStart}
          onOpenChange={(v) => !v && setNewStart(null)}
          initialStart={newStart}
          defaultDepositCents={depositDefaultCents}
        />
      )}
      <AppointmentDetailDialog appt={detail} onOpenChange={(v) => !v && setDetail(null)} />
    </div>
  );
}

function TimeGrid({
  days,
  appts,
  showToday,
  onEmptyClick,
  onApptClick,
}: {
  days: Date[];
  appts: Appt[];
  showToday: boolean;
  onEmptyClick: (d: Date) => void;
  onApptClick: (a: Appt) => void;
}) {
  const hours = hoursAxis();
  const gridHeight = hours.length * HOUR_PX;

  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border bg-card">
      <div className="flex min-w-[640px]">
        {/* hour axis */}
        <div className="w-14 shrink-0 border-r pt-10">
          {hours.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_PX }}
              className="relative -top-2 pr-2 text-right text-xs text-muted-foreground"
            >
              {format(new Date(2000, 0, 1, h), "h a")}
            </div>
          ))}
        </div>

        {/* day columns */}
        <div className="flex flex-1">
          {days.map((day) => {
            const dayAppts = appts.filter((a) => isSameDay(parseISO(a.start_at), day));
            const laid = layoutDay(dayAppts);
            return (
              <div key={day.toISOString()} className="flex-1 border-r last:border-r-0">
                <div
                  className={cn(
                    "sticky top-0 z-10 h-10 border-b bg-card px-2 py-1 text-center",
                    isToday(day) && showToday && "text-brand",
                  )}
                >
                  <div className="text-[11px] uppercase text-muted-foreground">
                    {format(day, "EEE")}
                  </div>
                  <div className="text-sm font-medium leading-none">{format(day, "d")}</div>
                </div>
                <div className="relative" style={{ height: gridHeight }}>
                  {/* clickable hour cells */}
                  {hours.map((h) => (
                    <button
                      key={h}
                      aria-label={`Add appointment ${format(day, "MMM d")} ${format(new Date(2000, 0, 1, h), "h a")}`}
                      onClick={() =>
                        onEmptyClick(
                          new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, 0),
                        )
                      }
                      style={{ height: HOUR_PX }}
                      className="block w-full border-b border-dashed border-border/60 hover:bg-brand-soft/40"
                    />
                  ))}
                  {/* appointments */}
                  {laid.map(({ appt, col, cols, top, height }) => {
                    const widthPct = 100 / cols;
                    return (
                      <button
                        key={appt.id}
                        onClick={() => onApptClick(appt)}
                        style={{
                          top,
                          height,
                          left: `${col * widthPct}%`,
                          width: `calc(${widthPct}% - 4px)`,
                        }}
                        className={cn(
                          "absolute overflow-hidden rounded-md border px-1.5 py-1 text-left text-xs shadow-sm",
                          STATUS_STYLES[appt.status] ?? "bg-muted",
                        )}
                      >
                        <span className="block truncate font-medium">
                          {format(parseISO(appt.start_at), "p")} ·{" "}
                          {appt.client_name ?? "Client"}
                        </span>
                        {appt.subject && (
                          <span className="block truncate opacity-80">{appt.subject}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthGrid({
  anchor,
  appts,
  showToday,
  onPickDay,
}: {
  anchor: Date;
  appts: Appt[];
  showToday: boolean;
  onPickDay: (d: Date) => void;
}) {
  const { start, end } = viewRange("month", anchor);
  const days = eachDayOfInterval({ start, end });
  return (
    <div className="overflow-hidden rounded-[var(--radius)] border bg-card">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-2 py-2 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayAppts = appts
            .filter((a) => isSameDay(parseISO(a.start_at), day))
            .sort((a, b) => a.start_at.localeCompare(b.start_at));
          return (
            <button
              key={day.toISOString()}
              onClick={() => onPickDay(day)}
              className={cn(
                "min-h-24 border-b border-r p-1.5 text-left align-top hover:bg-brand-soft/30",
                !isSameMonth(day, anchor) && "bg-muted/30 text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday(day) && showToday && "bg-brand text-brand-foreground",
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      "truncate rounded px-1 py-0.5 text-[10px]",
                      STATUS_STYLES[a.status] ?? "bg-muted",
                    )}
                  >
                    {format(parseISO(a.start_at), "p")} {a.client_name ?? "Client"}
                  </div>
                ))}
                {dayAppts.length > 3 && (
                  <div className="px-1 text-[10px] text-muted-foreground">
                    +{dayAppts.length - 3} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
