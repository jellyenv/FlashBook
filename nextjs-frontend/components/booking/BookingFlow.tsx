"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle2, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";

import { submitBookingAction } from "@/components/actions/booking-actions";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type DayAvailability = {
  date: string;
  slots: { start_at: string; end_at: string }[];
};

export function BookingFlow({
  slug,
  availability,
  depositCents,
  reviewFirst,
  accepting,
  testMode = false,
}: {
  slug: string;
  availability: DayAvailability[];
  depositCents: number;
  reviewFirst: boolean;
  accepting: boolean;
  testMode?: boolean;
}) {
  const [pending, start] = useTransition();
  const [day, setDay] = useState<DayAvailability | null>(
    availability.find((d) => d.slots.length > 0) ?? null,
  );
  const [slot, setSlot] = useState<{ start_at: string; end_at: string } | null>(null);
  const [done, setDone] = useState<{ message: string } | null>(null);
  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    size: "",
    placement: "",
    color_type: "black_and_grey",
    subject: "",
    accommodations_notes: "",
    has_guests: false,
    guests_notes: "",
    age_confirmed: false,
    card_ack: false,
  });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  if (!accepting) {
    return (
      <Card className="fb-card">
        <CardContent className="py-10 text-center text-muted-foreground">
          This artist isn&apos;t accepting bookings right now. Check back soon!
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="fb-card">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-accent-3" />
          <p className="font-display text-2xl">Thank you!</p>
          <p className="max-w-md text-muted-foreground">{done.message}</p>
        </CardContent>
      </Card>
    );
  }

  function submit() {
    if (!slot) return;
    if (!form.client_name || !form.client_email || !form.client_phone) {
      return void toast.error("Name, email, and phone are required.");
    }
    if (!form.age_confirmed) return void toast.error("Please confirm you are 18 or older.");
    if (testMode) {
      setDone({
        message:
          "This was a test — no booking was made. This is exactly what your clients will see. ✨",
      });
      return;
    }
    start(async () => {
      const res = await submitBookingAction(slug, {
        start_at: slot.start_at,
        end_at: slot.end_at,
        client_name: form.client_name,
        client_email: form.client_email,
        client_phone: form.client_phone,
        size: form.size || null,
        placement: form.placement || null,
        color_type: form.color_type as "color" | "black_and_grey",
        subject: form.subject || null,
        accommodations_notes: form.accommodations_notes || null,
        has_guests: form.has_guests,
        guests_notes: form.has_guests ? form.guests_notes || null : null,
        age_confirmed: form.age_confirmed,
        payment_method_id: null,
      });
      if ("error" in res) return void toast.error(res.error);
      setDone({ message: res.message });
    });
  }

  return (
    <Card className="fb-card">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Book your session</CardTitle>
        <CardDescription>
          Pick a day and time, then tell us about your piece.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Day strip */}
        <div>
          <Label className="mb-2 block">Choose a day</Label>
          <div className="flex flex-wrap gap-2">
            {availability.map((d) => {
              const available = d.slots.length > 0;
              const selected = day?.date === d.date;
              return (
                <button
                  key={d.date}
                  disabled={!available}
                  aria-pressed={selected}
                  onClick={() => {
                    setDay(d);
                    setSlot(null);
                  }}
                  className={cn(
                    "flex w-16 flex-col items-center rounded-[var(--radius)] border px-2 py-2 text-xs",
                    !available && "cursor-not-allowed opacity-40",
                    selected && "border-brand bg-brand-soft text-brand",
                  )}
                >
                  <span className="uppercase">{format(parseISO(d.date), "EEE")}</span>
                  <span className="text-base font-semibold">
                    {format(parseISO(d.date), "d")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(parseISO(d.date), "MMM")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time buttons */}
        {day && (
          <div>
            <Label className="mb-2 block">Available times</Label>
            {day.slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No times available this day.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {day.slots.map((s) => (
                  <Button
                    key={s.start_at}
                    type="button"
                    variant={slot?.start_at === s.start_at ? "brand" : "outline"}
                    size="sm"
                    onClick={() => setSlot(s)}
                  >
                    {format(parseISO(s.start_at), "p")}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Booking form */}
        {slot && (
          <div className="space-y-4 border-t pt-4">
            <p className="text-sm">
              <span className="font-medium">Selected:</span>{" "}
              {format(parseISO(slot.start_at), "EEEE, MMM d 'at' p")}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Full name *</Label>
                <Input id="name" value={form.client_name} onChange={(e) => set("client_name", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={form.client_email} onChange={(e) => set("client_email", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" type="tel" value={form.client_phone} onChange={(e) => set("client_phone", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="size">Size</Label>
                <Input id="size" value={form.size} onChange={(e) => set("size", e.target.value)} placeholder='e.g. 4"' />
              </div>
              <div>
                <Label htmlFor="place">Placement</Label>
                <Input id="place" value={form.placement} onChange={(e) => set("placement", e.target.value)} placeholder="forearm" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="color">Color or black &amp; grey</Label>
                <select
                  id="color"
                  value={form.color_type}
                  onChange={(e) => set("color_type", e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="black_and_grey">Black &amp; grey</option>
                  <option value="color">Color</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="subject">Describe your idea</Label>
                <Textarea id="subject" value={form.subject} onChange={(e) => set("subject", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="acc">Any accommodations or notes? (accessibility welcome)</Label>
                <Textarea id="acc" value={form.accommodations_notes} onChange={(e) => set("accommodations_notes", e.target.value)} />
              </div>
              <div className="sm:col-span-2 flex items-center justify-between rounded-md border p-3">
                <Label htmlFor="guests">Do you plan on having guests during your session?</Label>
                <Switch id="guests" checked={form.has_guests} onCheckedChange={(v) => set("has_guests", v)} />
              </div>
              {form.has_guests && (
                <div className="sm:col-span-2">
                  <Textarea
                    aria-label="Guest notes"
                    value={form.guests_notes}
                    onChange={(e) => set("guests_notes", e.target.value)}
                    placeholder="Tell us about your guests"
                  />
                </div>
              )}
            </div>

            {/* Card on file (Phase 1 placeholder for the deposit hold) */}
            <div className="rounded-[var(--radius)] border bg-muted/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <CreditCard className="h-4 w-4" /> Card on file · ${(depositCents / 100).toFixed(2)} deposit
              </div>
              <Input disabled placeholder="•••• •••• •••• ••••  (secure card capture)" />
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> Encrypted card capture via Stripe activates with
                payments. You won&apos;t be charged now.
              </p>
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.card_ack}
                  onChange={(e) => set("card_ack", e.target.checked)}
                  className="mt-1"
                />
                I authorize a ${(depositCents / 100).toFixed(2)} deposit hold for this booking.
              </label>
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.age_confirmed}
                onChange={(e) => set("age_confirmed", e.target.checked)}
                className="mt-1"
                required
              />
              I confirm I am 18 years of age or older.
            </label>

            <Button
              variant="brand"
              size="lg"
              className="w-full"
              onClick={submit}
              disabled={pending}
            >
              {pending
                ? "Submitting…"
                : reviewFirst
                  ? "Request booking"
                  : "Confirm booking"}
            </Button>
            {reviewFirst && (
              <p className="text-center text-xs text-muted-foreground">
                Your request will be reviewed by the artist before it&apos;s confirmed.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
