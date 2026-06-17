"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createExceptionAction,
  createRuleAction,
  deleteExceptionAction,
  deleteRuleAction,
} from "@/components/actions/studio-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Rule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes?: number;
};
type Exception = {
  id: string;
  date: string;
  type: "custom_hours" | "closed";
  start_time?: string | null;
  end_time?: string | null;
  note?: string | null;
};

export function HoursEditor({
  rules,
  exceptions,
}: {
  rules: Rule[];
  exceptions: Exception[];
}) {
  const [pending, start] = useTransition();
  const [day, setDay] = useState(0);
  const [from, setFrom] = useState("10:00");
  const [to, setTo] = useState("18:00");
  const [slot, setSlot] = useState(60);

  // Exception form
  const [exDate, setExDate] = useState("");
  const [exType, setExType] = useState<"closed" | "custom_hours">("closed");
  const [exFrom, setExFrom] = useState("12:00");
  const [exTo, setExTo] = useState("16:00");

  function addRule() {
    if (to <= from) return toast.error("End time must be after start time.");
    start(async () => {
      const res = await createRuleAction({
        day_of_week: day,
        start_time: `${from}:00`,
        end_time: `${to}:00`,
        slot_minutes: slot,
      });
      if (res?.error) toast.error(res.error);
      else toast.success(`Added ${DAYS[day]} hours`);
    });
  }

  function addException() {
    if (!exDate) return toast.error("Pick a date.");
    start(async () => {
      const res = await createExceptionAction({
        date: exDate,
        type: exType,
        start_time: exType === "custom_hours" ? `${exFrom}:00` : null,
        end_time: exType === "custom_hours" ? `${exTo}:00` : null,
      });
      if (res?.error) toast.error(res.error);
      else toast.success("Saved exception");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="fb-card">
        <CardHeader>
          <CardTitle className="font-display">Weekly hours</CardTitle>
          <CardDescription>Recurring availability by day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {DAYS.map((label, idx) => {
              const dayRules = rules.filter((r) => r.day_of_week === idx);
              return (
                <li key={idx} className="rounded-[var(--radius)] border p-3">
                  <p className="mb-1 text-sm font-medium">{label}</p>
                  {dayRules.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Closed</p>
                  ) : (
                    <ul className="space-y-1">
                      {dayRules.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>
                            {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}
                            <span className="ml-2 text-xs text-muted-foreground">
                              {r.slot_minutes ?? 60}m slots
                            </span>
                          </span>
                          <button
                            aria-label="Delete rule"
                            disabled={pending}
                            onClick={() =>
                              start(async () => {
                                await deleteRuleAction(r.id);
                              })
                            }
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="rounded-[var(--radius)] border bg-muted/40 p-3">
            <p className="mb-3 text-sm font-medium">Add hours</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="day">Day</Label>
                <select
                  id="day"
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="from">Start</Label>
                <Input
                  id="from"
                  type="time"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="to">End</Label>
                <Input
                  id="to"
                  type="time"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="slot">Slot length (minutes)</Label>
                <Input
                  id="slot"
                  type="number"
                  min={15}
                  step={15}
                  value={slot}
                  onChange={(e) => setSlot(Number(e.target.value))}
                />
              </div>
            </div>
            <Button
              onClick={addRule}
              disabled={pending}
              variant="brand"
              className="mt-3 w-full"
            >
              Add weekly hours
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="fb-card">
        <CardHeader>
          <CardTitle className="font-display">Custom days & blackouts</CardTitle>
          <CardDescription>Override a specific date</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exceptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exceptions yet.</p>
          ) : (
            <ul className="space-y-2">
              {exceptions.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-[var(--radius)] border p-2 text-sm"
                >
                  <span>
                    {e.date} ·{" "}
                    {e.type === "closed" ? (
                      <span className="text-destructive">Closed</span>
                    ) : (
                      <>
                        {e.start_time?.slice(0, 5)}–{e.end_time?.slice(0, 5)}
                      </>
                    )}
                  </span>
                  <button
                    aria-label="Delete exception"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        await deleteExceptionAction(e.id);
                      })
                    }
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-[var(--radius)] border bg-muted/40 p-3">
            <p className="mb-3 text-sm font-medium">Add exception</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="exdate">Date</Label>
                <Input
                  id="exdate"
                  type="date"
                  value={exDate}
                  onChange={(e) => setExDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={exType === "closed" ? "brand" : "outline"}
                  onClick={() => setExType("closed")}
                >
                  Closed
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={exType === "custom_hours" ? "brand" : "outline"}
                  onClick={() => setExType("custom_hours")}
                >
                  Custom hours
                </Button>
              </div>
              {exType === "custom_hours" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="exfrom">Start</Label>
                    <Input
                      id="exfrom"
                      type="time"
                      value={exFrom}
                      onChange={(e) => setExFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exto">End</Label>
                    <Input
                      id="exto"
                      type="time"
                      value={exTo}
                      onChange={(e) => setExTo(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <Button
                onClick={addException}
                disabled={pending}
                variant="brand"
                className="w-full"
              >
                Save exception
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
