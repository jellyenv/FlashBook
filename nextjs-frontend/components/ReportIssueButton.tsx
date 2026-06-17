"use client";

import { useState } from "react";
import { CheckCircle2, LifeBuoy } from "lucide-react";
import { toast } from "sonner";

import { submitIssueReport } from "@/components/actions/issue-actions";
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
import { Textarea } from "@/components/ui/textarea";

/** Subtle floating "Report an issue" control for any surface. */
export function ReportIssueButton({
  role = "anonymous",
}: {
  role?: "artist" | "client" | "anonymous";
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [incident, setIncident] = useState<string | null>(null);

  async function submit() {
    if (message.trim().length < 5) {
      return toast.error("Please describe the issue.");
    }
    setBusy(true);
    const res = await submitIssueReport({
      message,
      role,
      email: email || null,
      page: typeof window !== "undefined" ? window.location.pathname : null,
    });
    setBusy(false);
    if ("error" in res) return void toast.error(res.error);
    setIncident(res.incident_code ?? null);
  }

  function reset() {
    setOpen(false);
    setTimeout(() => {
      setMessage("");
      setEmail("");
      setIncident(null);
    }, 200);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full border bg-background/90 px-3 py-2 text-xs font-medium text-muted-foreground shadow-md backdrop-blur transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Report an issue"
      >
        <LifeBuoy className="h-4 w-4" />
        <span className="hidden sm:inline">Report an issue</span>
      </button>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : reset())}>
        <DialogContent>
          {incident ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-accent-3" />
              <DialogTitle>Report received</DialogTitle>
              <DialogDescription>
                Thank you! Your reference ID is:
              </DialogDescription>
              <p className="rounded-md bg-muted px-3 py-1.5 font-mono text-lg font-semibold">
                {incident}
              </p>
              <p className="text-xs text-muted-foreground">
                Keep this ID if you follow up about the issue.
              </p>
              <Button variant="brand" onClick={reset}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Report an issue</DialogTitle>
                <DialogDescription>
                  Found a bug or something off? Tell us what happened.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="issue-msg">What happened?</Label>
                  <Textarea
                    id="issue-msg"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the issue and what you were doing…"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="issue-email">Email (optional)</Label>
                  <Input
                    id="issue-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="So we can follow up"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={reset}>
                  Cancel
                </Button>
                <Button variant="brand" onClick={submit} disabled={busy}>
                  {busy ? "Sending…" : "Send report"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
