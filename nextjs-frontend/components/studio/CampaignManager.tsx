"use client";

import { useState, useTransition } from "react";
import { Mail, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createCampaignAction,
  deleteCampaignAction,
} from "@/components/actions/studio-actions";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";

type Campaign = {
  id: string;
  name: string;
  body: string;
  link?: string | null;
  channel: "email" | "sms" | "in_app";
  status: string;
};

export function CampaignManager({ campaigns }: { campaigns: Campaign[] }) {
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    name: "",
    channel: "email" as "email" | "sms",
    body: "",
    link: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function save() {
    if (!form.name.trim() || !form.body.trim()) {
      return toast.error("Name and message are required.");
    }
    start(async () => {
      const res = await createCampaignAction({
        name: form.name,
        body: form.body,
        link: form.link || null,
        channel: form.channel,
      });
      if (res?.error) return void toast.error(res.error);
      toast.success("Draft saved");
      setForm({ name: "", channel: "email", body: "", link: "" });
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="fb-card h-fit">
        <CardHeader>
          <CardTitle className="font-display">New campaign</CardTitle>
          <CardDescription>
            Saved as a draft until sending is enabled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="cname">Name</Label>
            <Input
              id="cname"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="November books open"
            />
          </div>
          <div>
            <Label htmlFor="cchan">Channel</Label>
            <select
              id="cchan"
              value={form.channel}
              onChange={(e) => set("channel", e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="email">Email</option>
              <option value="sms">Text (SMS)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="cbody">Message</Label>
            <Textarea
              id="cbody"
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder="Books are open! Tap to grab a slot 👇"
            />
          </div>
          <div>
            <Label htmlFor="clink">Link (optional)</Label>
            <Input
              id="clink"
              value={form.link}
              onChange={(e) => set("link", e.target.value)}
              placeholder="https://…/book/your-slug"
            />
          </div>
          <Button
            variant="brand"
            className="w-full"
            onClick={save}
            disabled={pending}
          >
            {pending ? "Saving…" : "Save draft"}
          </Button>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        {campaigns.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-[var(--radius)] border border-dashed text-sm text-muted-foreground">
            No campaigns yet — draft your first announcement.
          </div>
        ) : (
          <ul className="space-y-2">
            {campaigns.map((c) => (
              <li key={c.id}>
                <Card className="fb-card">
                  <CardContent className="flex items-start justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{c.name}</p>
                        <Badge variant="secondary" className="capitalize">
                          {c.channel === "sms" ? (
                            <MessageSquare className="mr-1 h-3 w-3" />
                          ) : (
                            <Mail className="mr-1 h-3 w-3" />
                          )}
                          {c.channel}
                        </Badge>
                        <Badge variant="secondary">{c.status}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {c.body}
                      </p>
                      {c.link && (
                        <p className="truncate text-xs text-brand">{c.link}</p>
                      )}
                    </div>
                    <button
                      aria-label="Delete campaign"
                      disabled={pending}
                      onClick={() =>
                        start(
                          async () => void (await deleteCampaignAction(c.id)),
                        )
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
