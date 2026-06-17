import { addDays, parseISO } from "date-fns";

import { CalendarView } from "@/components/calendar/CalendarView";
import type { CalView } from "@/lib/calendar";
import { viewRange } from "@/lib/calendar";
import { fetchAppointments, fetchMyProfile } from "@/lib/studio-data";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; appointment?: string }>;
}) {
  const params = await searchParams;
  const view: CalView =
    params.view === "day" || params.view === "month" ? params.view : "week";
  const dateISO = params.date ?? new Date().toISOString().slice(0, 10);
  const anchor = parseISO(dateISO);

  const { start, end } = viewRange(view, anchor);
  const [profile, appts] = await Promise.all([
    fetchMyProfile(),
    fetchAppointments(start.toISOString(), addDays(end, 1).toISOString()),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Calendar</h1>
      <CalendarView
        appts={appts}
        view={view}
        dateISO={dateISO}
        depositDefaultCents={profile?.deposit_default_cents ?? 5000}
        selectedId={params.appointment}
      />
    </div>
  );
}
