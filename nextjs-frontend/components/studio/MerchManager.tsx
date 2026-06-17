"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
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
import { formatMoney } from "@/lib/money";

type Product = {
  id: string;
  title: string;
  description?: string | null;
  price_cents: number;
  images?: string[] | null;
  inventory?: number | null;
  active: boolean;
};

export function MerchManager({ products }: { products: Product[] }) {
  const [pending, start] = useTransition();
  const [imageUrl, setImageUrl] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    inventory: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function add() {
    if (!form.title.trim()) return toast.error("Title is required.");
    if (!form.price) return toast.error("Price is required.");
    start(async () => {
      const res = await createProductAction({
        title: form.title,
        description: form.description || null,
        price_cents: Math.round(parseFloat(form.price) * 100),
        image_url: imageUrl || null,
        inventory: form.inventory ? parseInt(form.inventory, 10) : null,
        active: true,
      });
      if (res?.error) return void toast.error(res.error);
      toast.success("Product added");
      setForm({ title: "", description: "", price: "", inventory: "" });
      setImageUrl("");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="fb-card h-fit">
        <CardHeader>
          <CardTitle className="font-display">Add product</CardTitle>
          <CardDescription>Image, title, price</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ImageUpload
            currentUrl={imageUrl || undefined}
            onUploaded={setImageUrl}
            label="Upload product image"
          />
          <div>
            <Label htmlFor="ptitle">Title</Label>
            <Input
              id="ptitle"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Flash print — A4"
            />
          </div>
          <div>
            <Label htmlFor="pdesc">Description</Label>
            <Textarea
              id="pdesc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="pprice">Price $</Label>
              <Input
                id="pprice"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pinv">Inventory</Label>
              <Input
                id="pinv"
                type="number"
                min={0}
                step="1"
                value={form.inventory}
                onChange={(e) => set("inventory", e.target.value)}
                placeholder="∞"
              />
            </div>
          </div>
          <Button variant="brand" className="w-full" onClick={add} disabled={pending}>
            {pending ? "Adding…" : "Add product"}
          </Button>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        {products.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-[var(--radius)] border border-dashed text-sm text-muted-foreground">
            No products yet — add your first item.
          </div>
        ) : (
          <ul className="space-y-2">
            {products.map((p) => (
              <li key={p.id}>
                <Card className="fb-card">
                  <CardContent className="flex items-center gap-3 p-3">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatMoney(p.price_cents)}
                        {p.inventory != null && ` · ${p.inventory} in stock`}
                      </p>
                      {!p.active && (
                        <Badge variant="secondary" className="mt-1">
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        Active
                        <Switch
                          checked={p.active}
                          disabled={pending}
                          onCheckedChange={(v) =>
                            start(async () => {
                              const res = await updateProductAction(p.id, {
                                active: v,
                              });
                              if (res?.error) toast.error(res.error);
                            })
                          }
                        />
                      </label>
                      <button
                        aria-label="Delete product"
                        disabled={pending}
                        onClick={() =>
                          start(async () => void (await deleteProductAction(p.id)))
                        }
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
