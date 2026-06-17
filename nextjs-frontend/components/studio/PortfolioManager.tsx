"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createPortfolioImageAction,
  deletePortfolioImageAction,
} from "@/components/actions/studio-actions";
import { ImageUpload } from "@/components/studio/ImageUpload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PortfolioImage = {
  id: string;
  image_url: string;
  caption?: string | null;
};

export function PortfolioManager({ images }: { images: PortfolioImage[] }) {
  const [pending, start] = useTransition();
  const [caption, setCaption] = useState("");

  function addImage(url: string) {
    start(async () => {
      const res = await createPortfolioImageAction({
        image_url: url,
        caption: caption || null,
      });
      if (res?.error) return void toast.error(res.error);
      toast.success("Added to portfolio");
      setCaption("");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="fb-card h-fit">
        <CardHeader>
          <CardTitle className="font-display">Add work</CardTitle>
          <CardDescription>Upload a photo of a finished piece</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="cap">Caption (optional)</Label>
            <Input
              id="cap"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Neo-traditional rose, forearm"
            />
          </div>
          <ImageUpload onUploaded={addImage} label="Upload portfolio image" />
          {pending && <p className="text-xs text-muted-foreground">Saving…</p>}
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        {images.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-[var(--radius)] border border-dashed text-sm text-muted-foreground">
            No work yet — upload your first piece.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative overflow-hidden rounded-[var(--radius)] border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt={img.caption ?? "Portfolio piece"}
                  className="aspect-square w-full object-cover"
                />
                <button
                  aria-label="Delete image"
                  disabled={pending}
                  onClick={() =>
                    start(
                      async () =>
                        void (await deletePortfolioImageAction(img.id)),
                    )
                  }
                  className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-destructive opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {img.caption && (
                  <p className="truncate bg-background/90 px-2 py-1 text-xs">
                    {img.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
