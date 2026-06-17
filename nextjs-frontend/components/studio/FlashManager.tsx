"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createFlashAction,
  deleteFlashAction,
  updateFlashAction,
} from "@/components/actions/studio-actions";
import { ImageUpload } from "@/components/studio/ImageUpload";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  EVENT_TAGS,
  eventLabel,
  formatFlashPrice,
  formatFlashSize,
} from "@/lib/flash";
import { cn } from "@/lib/utils";

type FlashPiece = {
  id: string;
  image_url: string;
  title?: string | null;
  description?: string | null;
  price_min_cents?: number | null;
  price_max_cents?: number | null;
  price_plus: boolean;
  size_min?: string | null;
  size_plus: boolean;
  ask_about: boolean;
  status: "available" | "claimed";
  event_tag?: string | null;
};

const EMPTY = {
  title: "",
  description: "",
  ask_about: false,
  price_min: "",
  price_max: "",
  price_plus: false,
  size_min: "",
  size_plus: false,
  event_tag: "",
};

export function FlashManager({ pieces }: { pieces: FlashPiece[] }) {
  const [pending, start] = useTransition();
  const [imageUrl, setImageUrl] = useState("");
  const [form, setForm] = useState({ ...EMPTY });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  function add() {
    if (!imageUrl) return toast.error("Upload a flash image first.");
    start(async () => {
      const res = await createFlashAction({
        image_url: imageUrl,
        title: form.title || null,
        description: form.description || null,
        ask_about: form.ask_about,
        price_min_cents:
          form.ask_about || !form.price_min
            ? null
            : Math.round(parseFloat(form.price_min) * 100),
        price_max_cents:
          form.ask_about || !form.price_max
            ? null
            : Math.round(parseFloat(form.price_max) * 100),
        price_plus: form.price_plus,
        size_min: form.size_min || null,
        size_plus: form.size_plus,
        event_tag: form.event_tag || null,
      });
      if (res?.error) return void toast.error(res.error);
      toast.success("Flash posted");
      setForm({ ...EMPTY });
      setImageUrl("");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Add panel */}
      <Card className="fb-card h-fit">
        <CardHeader>
          <CardTitle className="font-display">Post flash</CardTitle>
          <CardDescription>Upload art, then set the details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ImageUpload
            currentUrl={imageUrl || undefined}
            onUploaded={setImageUrl}
            label="Upload flash art"
          />
          <div>
            <Label htmlFor="ftitle">Title</Label>
            <Input
              id="ftitle"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Dagger & rose"
            />
          </div>
          <div>
            <Label htmlFor="fdesc">Description</Label>
            <Textarea
              id="fdesc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="ask">Ask about this piece</Label>
              <p className="text-xs text-muted-foreground">
                Hide price, invite a consult
              </p>
            </div>
            <Switch
              id="ask"
              checked={form.ask_about}
              onCheckedChange={(v) => set("ask_about", v)}
            />
          </div>

          {!form.ask_about && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Price range</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="pmin">Min $</Label>
                  <Input
                    id="pmin"
                    type="number"
                    min={0}
                    step="1"
                    value={form.price_min}
                    onChange={(e) => set("price_min", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pmax">Max $ (optional)</Label>
                  <Input
                    id="pmax"
                    type="number"
                    min={0}
                    step="1"
                    value={form.price_max}
                    onChange={(e) => set("price_max", e.target.value)}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.price_plus}
                  onCheckedChange={(v) => set("price_plus", v)}
                />
                Add &ldquo;+&rdquo; (price rises with consultation)
              </label>
            </div>
          )}

          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Size</p>
            <div>
              <Label htmlFor="smin">Minimum size</Label>
              <Input
                id="smin"
                value={form.size_min}
                onChange={(e) => set("size_min", e.target.value)}
                placeholder='3"'
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.size_plus}
                onCheckedChange={(v) => set("size_plus", v)}
              />
              Add &ldquo;+&rdquo; (can size up)
            </label>
          </div>

          <div>
            <Label htmlFor="evt">Flash event (optional)</Label>
            <select
              id="evt"
              value={form.event_tag}
              onChange={(e) => set("event_tag", e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {EVENT_TAGS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="brand"
            className="w-full"
            onClick={add}
            disabled={pending || !imageUrl}
          >
            {pending ? "Posting…" : "Post flash piece"}
          </Button>
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="lg:col-span-2">
        {pieces.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-[var(--radius)] border border-dashed text-sm text-muted-foreground">
            No flash yet — post your first piece.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pieces.map((p) => {
              const price = formatFlashPrice(p);
              const size = formatFlashSize(p);
              const tag = eventLabel(p.event_tag);
              const claimed = p.status === "claimed";
              return (
                <div
                  key={p.id}
                  className="group relative overflow-hidden rounded-[var(--radius)] border bg-card"
                >
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image_url}
                      alt={p.title ?? "Flash piece"}
                      className={cn(
                        "aspect-square w-full object-cover",
                        claimed && "opacity-50",
                      )}
                    />
                    {claimed && (
                      <span className="absolute left-2 top-2 rounded-full bg-foreground/80 px-2 py-0.5 text-xs font-medium text-background">
                        Claimed
                      </span>
                    )}
                    {tag && (
                      <span className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-xs">
                        {tag}
                      </span>
                    )}
                    <button
                      aria-label="Delete flash"
                      disabled={pending}
                      onClick={() =>
                        start(async () => void (await deleteFlashAction(p.id)))
                      }
                      className="absolute bottom-2 right-2 rounded-full bg-background/90 p-1.5 text-destructive opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-1 p-2">
                    {p.title && (
                      <p className="truncate text-sm font-medium">{p.title}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {p.ask_about ? (
                        <Badge
                          variant="secondary"
                          className="bg-brand-soft text-brand"
                        >
                          Ask about this piece
                        </Badge>
                      ) : (
                        price && <span className="font-medium">{price}</span>
                      )}
                      {size && (
                        <span className="text-muted-foreground">· {size}</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      className="mt-1 w-full"
                      onClick={() =>
                        start(async () => {
                          const res = await updateFlashAction(p.id, {
                            status: claimed ? "available" : "claimed",
                          });
                          if (res?.error) toast.error(res.error);
                        })
                      }
                    >
                      {claimed ? "Mark available" : "Mark claimed"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
