"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import {
  createAppointmentAction,
  deleteAppointmentAction,
  setAppointmentStatusAction,
} from "@/components/actions/studio-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Appt } from "@/lib/calendar";

function toLocalParts(d: Date) {
  return {
    date: format(d, "yyyy-MM-dd"),
    time: format(d, "HH:mm"),
  };
}

export function NewAppointmentDialog({
  open,
  onOpenChange,
  initialStart,
  defaultDepositCents,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialStart: Date;
  defaultDepositCents: number;
}) {
  const parts = toLocalParts(initialStart);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    client_instagram: "",
    date: parts.date,
    time: parts.time,
    duration: 60,
    size: "",
    placement: "",
    color_type: "black_and_grey",
    subject: "",
    deposit: (defaultDepositCents / 100).toString(),
    accommodations_notes: "",
    has_guests: false,
    guests_notes: "",
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    if (!form.client_name.trim()) return void toast.error("Client name is required.");
    const startAt = new Date(`${form.date}T${form.time}`);
    const endAt = new Date(startAt.getTime() + form.duration * 60000);
    start(async () => {
      const res = await createAppointmentAction({
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        client_name: form.client_name,
        client_phone: form.client_phone || null,
        client_email: form.client_email || null,
        client_instagram: form.client_instagram || null,
        size: form.size || null,
        placement: form.placement || null,
        color_type: form.color_type as "color" | "black_and_grey",
        subject: form.subject || null,
        accommodations_notes: form.accommodations_notes || null,
        has_guests: form.has_guests,
        guests_notes: form.has_guests ? form.guests_notes || null : null,
        deposit_cents: Math.round(parseFloat(form.deposit || "0") * 100),
      });
      if (res?.error) return void toast.error(res.error);
      toast.success("Appointment added");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>
            Add a booking manually. The client is saved to Contacts for later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground">Client</legend>
            <div>
              <Label htmlFor="cn">Name *</Label>
              <Input
                id="cn"
                value={form.client_name}
                onChange={(e) => set("client_name", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cp">Phone</Label>
                <Input
                  id="cp"
                  value={form.client_phone}
                  onChange={(e) => set("client_phone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ce">Email</Label>
                <Input
                  id="ce"
                  type="email"
                  value={form.client_email}
                  onChange={(e) => set("client_email", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ci">Instagram / alt ID</Label>
              <Input
                id="ci"
                value={form.client_instagram}
                onChange={(e) => set("client_instagram", e.target.value)}
                placeholder="@handle"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground">Schedule</legend>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="d">Date</Label>
                <Input
                  id="d"
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="t">Start</Label>
                <Input
                  id="t"
                  type="time"
                  value={form.time}
                  onChange={(e) => set("time", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dur">Mins</Label>
                <Input
                  id="dur"
                  type="number"
                  min={15}
                  step={15}
                  value={form.duration}
                  onChange={(e) => set("duration", Number(e.target.value))}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground">Tattoo</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sz">Size</Label>
                <Input
                  id="sz"
                  value={form.size}
                  onChange={(e) => set("size", e.target.value)}
                  placeholder='e.g. 4"'
                />
              </div>
              <div>
                <Label htmlFor="pl">Placement</Label>
                <Input
                  id="pl"
                  value={form.placement}
                  onChange={(e) => set("placement", e.target.value)}
                  placeholder="forearm"
                />
              </div>
              <div>
                <Label htmlFor="col">Color / Black</Label>
                <select
                  id="col"
                  value={form.color_type}
                  onChange={(e) => set("color_type", e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="black_and_grey">Black &amp; grey</option>
                  <option value="color">Color</option>
                </select>
              </div>
              <div>
                <Label htmlFor="dep">Deposit ($)</Label>
                <Input
                  id="dep"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.deposit}
                  onChange={(e) => set("deposit", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="subj">Subject</Label>
              <Textarea
                id="subj"
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
                placeholder="Snake wrapped around a dagger…"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground">Notes</legend>
            <div>
              <Label htmlFor="acc">Accommodations / notes</Label>
              <Textarea
                id="acc"
                value={form.accommodations_notes}
                onChange={(e) => set("accommodations_notes", e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="guests">Guests during session?</Label>
              <Switch
                id="guests"
                checked={form.has_guests}
                onCheckedChange={(v) => set("has_guests", v)}
              />
            </div>
            {form.has_guests && (
              <Textarea
                aria-label="Guest notes"
                value={form.guests_notes}
                onChange={(e) => set("guests_notes", e.target.value)}
                placeholder="Who's coming with them?"
              />
            )}
          </fieldset>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="brand" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : "Add appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AppointmentDetailDialog({
  appt,
  onOpenChange,
}: {
  appt: Appt | null;
  onOpenChange: (v: boolean) => void;
}) {
  const [pending, start] = useTransition();
  if (!appt) return null;

  const act = (
    fn: () => Promise<{ error?: string } | void>,
    successMsg: string,
  ) =>
    start(async () => {
      const res = await fn();
      if (res && "error" in res && res.error) return void toast.error(res.error);
      toast.success(successMsg);
      onOpenChange(false);
    });

  const isPending = appt.status === "under_review" || appt.status === "requested";

  return (
    <Dialog open={!!appt} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{appt.client_name ?? "Appointment"}</DialogTitle>
          <DialogDescription>
            {format(parseISO(appt.start_at), "EEEE, MMM d · p")} –{" "}
            {format(parseISO(appt.end_at), "p")}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Status" value={appt.status.replace("_", " ")} />
          <Field label="Source" value={appt.source.replace("_", " ")} />
          {appt.subject && <Field label="Subject" value={appt.subject} full />}
          {appt.size && <Field label="Size" value={appt.size} />}
          {appt.placement && <Field label="Placement" value={appt.placement} />}
          {appt.color_type && (
            <Field label="Color" value={appt.color_type.replace("_", " ")} />
          )}
          {typeof appt.deposit_cents === "number" && appt.deposit_cents > 0 && (
            <Field label="Deposit" value={`$${(appt.deposit_cents / 100).toFixed(2)}`} />
          )}
          {appt.has_guests && <Field label="Guests" value="Yes" />}
          {appt.accommodations_notes && (
            <Field label="Accommodations" value={appt.accommodations_notes} full />
          )}
        </dl>

        <DialogFooter className="flex-wrap gap-2">
          {isPending && (
            <>
              <Button
                variant="brand"
                disabled={pending}
                onClick={() =>
                  act(
                    () => setAppointmentStatusAction(appt.id, "confirmed"),
                    "Booking confirmed",
                  )
                }
              >
                Confirm
              </Button>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() =>
                  act(
                    () => setAppointmentStatusAction(appt.id, "declined"),
                    "Booking declined",
                  )
                }
              >
                Decline
              </Button>
            </>
          )}
          {appt.status === "confirmed" && (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                act(
                  () => setAppointmentStatusAction(appt.id, "completed"),
                  "Marked complete",
                )
              }
            >
              Mark complete
            </Button>
          )}
          <Button
            variant="ghost"
            className="text-destructive"
            disabled={pending}
            onClick={() => act(() => deleteAppointmentAction(appt.id), "Deleted")}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="capitalize">{value}</dd>
    </div>
  );
}
