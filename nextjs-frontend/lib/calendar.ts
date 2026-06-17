import {
  addDays,
  endOfMonth,
  endOfWeek,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export type CalView = "day" | "week" | "month";

export type Appt = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  source: string;
  client_name?: string | null;
  subject?: string | null;
  title?: string | null;
  size?: string | null;
  placement?: string | null;
  color_type?: string | null;
  has_guests?: boolean;
  accommodations_notes?: string | null;
  deposit_cents?: number;
};

export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 22; // exclusive end of grid
export const HOUR_PX = 56;

/** Visible [start, end) range for a view anchored on `date`. */
export function viewRange(
  view: CalView,
  date: Date,
): { start: Date; end: Date } {
  if (view === "day") {
    return { start: startOfDay(date), end: addDays(startOfDay(date), 1) };
  }
  if (view === "week") {
    return {
      start: startOfWeek(date, { weekStartsOn: 1 }),
      end: addDays(endOfWeek(date, { weekStartsOn: 1 }), 0),
    };
  }
  // month grid is padded to whole weeks
  return {
    start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }),
  };
}

export function hoursAxis(): number[] {
  return Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR },
    (_, i) => DAY_START_HOUR + i,
  );
}

/** Vertical offset (px) of a Date within the day grid. */
export function offsetPx(d: Date): number {
  const minutes = (d.getHours() - DAY_START_HOUR) * 60 + d.getMinutes();
  return (minutes / 60) * HOUR_PX;
}

/** Pack overlapping appointments into side-by-side columns for legibility. */
export function layoutDay(appts: Appt[]): {
  appt: Appt;
  col: number;
  cols: number;
  top: number;
  height: number;
}[] {
  const sorted = [...appts].sort(
    (a, b) => parseISO(a.start_at).getTime() - parseISO(b.start_at).getTime(),
  );
  const out: {
    appt: Appt;
    col: number;
    cols: number;
    top: number;
    height: number;
  }[] = [];
  let cluster: typeof out = [];
  let clusterEnd = 0;

  const flush = () => {
    const cols = cluster.reduce((m, c) => Math.max(m, c.col + 1), 0);
    cluster.forEach((c) => (c.cols = cols));
    cluster = [];
  };

  for (const appt of sorted) {
    const s = parseISO(appt.start_at);
    const e = parseISO(appt.end_at);
    const top = offsetPx(s);
    const height = Math.max(offsetPx(e) - top, 22);
    if (cluster.length && s.getTime() >= clusterEnd) {
      flush();
      clusterEnd = 0;
    }
    // first free column whose events don't overlap this one
    const used = new Set(
      cluster
        .filter((c) => parseISO(c.appt.end_at).getTime() > s.getTime())
        .map((c) => c.col),
    );
    let col = 0;
    while (used.has(col)) col++;
    const item = { appt, col, cols: 1, top, height };
    cluster.push(item);
    out.push(item);
    clusterEnd = Math.max(clusterEnd, e.getTime());
  }
  flush();
  return out;
}

export const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-accent-3/15 border-accent-3/40 text-accent-3",
  under_review: "bg-brand-soft border-brand/40 text-brand",
  requested: "bg-muted border-border text-muted-foreground",
  completed: "bg-accent-3/15 border-accent-3/40 text-accent-3",
  cancelled: "bg-muted border-border text-muted-foreground line-through",
  declined: "bg-destructive/10 border-destructive/30 text-destructive",
  no_show: "bg-destructive/10 border-destructive/30 text-destructive",
};
