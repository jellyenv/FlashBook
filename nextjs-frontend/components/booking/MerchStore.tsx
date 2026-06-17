"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { submitCheckoutAction } from "@/components/actions/booking-actions";
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
import { formatMoney } from "@/lib/money";
import { MERCH_TERMS } from "@/lib/terms";

type Product = {
  id: string;
  title: string;
  description?: string | null;
  price_cents: number;
  images?: string[] | null;
};

type CartLine = {
  productId: string;
  title: string;
  price_cents: number;
  image?: string;
  quantity: number;
};

type Stage = null | "cart" | "checkout" | "done";

export function MerchStore({
  slug,
  products,
}: {
  slug: string;
  products: Product[];
}) {
  const storageKey = `flashbook-cart-${slug}`;
  const [cart, setCart] = useState<CartLine[]>([]);
  const [stage, setStage] = useState<Stage>(null);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ total: number; message: string } | null>(null);

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: "",
    notes: "",
    accepted_terms: false,
  });
  const [showTerms, setShowTerms] = useState(false);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  // Load / persist cart
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setCart(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [storageKey]);
  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, loaded, storageKey]);

  const count = cart.reduce((n, c) => n + c.quantity, 0);
  const subtotal = useMemo(
    () => cart.reduce((s, c) => s + c.price_cents * c.quantity, 0),
    [cart],
  );

  function addToCart(p: Product) {
    setCart((prev) => {
      const found = prev.find((c) => c.productId === p.id);
      if (found) {
        return prev.map((c) =>
          c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          title: p.title,
          price_cents: p.price_cents,
          image: p.images?.[0],
          quantity: 1,
        },
      ];
    });
    toast.success("Added to cart");
  }

  const setQty = (id: string, qty: number) =>
    setCart((prev) =>
      qty <= 0
        ? prev.filter((c) => c.productId !== id)
        : prev.map((c) => (c.productId === id ? { ...c, quantity: qty } : c)),
    );

  async function placeOrder() {
    if (!form.customer_name || !form.customer_email) {
      return toast.error("Name and email are required.");
    }
    if (!form.accepted_terms) {
      return toast.error("Please accept the terms and conditions.");
    }
    setSubmitting(true);
    const res = await submitCheckoutAction(slug, {
      items: cart.map((c) => ({ product_id: c.productId, quantity: c.quantity })),
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone || null,
      shipping_address: form.shipping_address || null,
      notes: form.notes || null,
      accepted_terms: form.accepted_terms,
    });
    setSubmitting(false);
    if ("error" in res) return void toast.error(res.error);
    setConfirmation({ total: res.total_cents, message: res.message });
    setCart([]);
    setStage("done");
  }

  if (products.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed bg-card/60 p-8 text-center text-sm text-muted-foreground">
        No merch available right now.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl">Merch</h2>
        <Button variant="outline" size="sm" onClick={() => setStage("cart")}>
          <ShoppingBag className="mr-1.5 h-4 w-4" />
          Cart{count > 0 ? ` · ${count}` : ""}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex flex-col overflow-hidden rounded-[var(--radius)] border bg-card"
          >
            {p.images?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.images[0]}
                alt={p.title}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
            )}
            <div className="flex flex-1 flex-col gap-1 p-2">
              <p className="truncate text-sm font-medium">{p.title}</p>
              {p.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {p.description}
                </p>
              )}
              <p className="mt-auto text-sm font-semibold">
                {formatMoney(p.price_cents)}
              </p>
              <Button
                size="sm"
                variant="brand"
                className="mt-1 w-full"
                onClick={() => addToCart(p)}
              >
                Add to cart
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={stage !== null} onOpenChange={(o) => !o && setStage(null)}>
        <DialogContent>
          {stage === "cart" && (
            <>
              <DialogHeader>
                <DialogTitle>Your cart</DialogTitle>
                <DialogDescription>
                  {count === 0 ? "Your cart is empty." : `${count} item(s)`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {cart.map((c) => (
                  <div key={c.productId} className="flex items-center gap-3">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.image}
                        alt={c.title}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(c.price_cents)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        aria-label="Decrease"
                        onClick={() => setQty(c.productId, c.quantity - 1)}
                        className="rounded-full border p-1 hover:bg-accent"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-sm">{c.quantity}</span>
                      <button
                        aria-label="Increase"
                        onClick={() => setQty(c.productId, c.quantity + 1)}
                        className="rounded-full border p-1 hover:bg-accent"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        aria-label="Remove"
                        onClick={() => setQty(c.productId, 0)}
                        className="ml-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {count > 0 && (
                <DialogFooter className="!flex-col gap-2 sm:!flex-col">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Subtotal</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  <Button
                    variant="brand"
                    className="w-full"
                    onClick={() => setStage("checkout")}
                  >
                    Checkout
                  </Button>
                </DialogFooter>
              )}
            </>
          )}

          {stage === "checkout" && (
            <>
              <DialogHeader>
                <DialogTitle>Checkout</DialogTitle>
                <DialogDescription>
                  {count} item(s) · {formatMoney(subtotal)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="cn">Full name *</Label>
                    <Input
                      id="cn"
                      value={form.customer_name}
                      onChange={(e) => set("customer_name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ce">Email *</Label>
                    <Input
                      id="ce"
                      type="email"
                      value={form.customer_email}
                      onChange={(e) => set("customer_email", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cp">Phone</Label>
                    <Input
                      id="cp"
                      type="tel"
                      value={form.customer_phone}
                      onChange={(e) => set("customer_phone", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ship">Shipping address</Label>
                  <Textarea
                    id="ship"
                    value={form.shipping_address}
                    onChange={(e) => set("shipping_address", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="onotes">Order notes</Label>
                  <Textarea
                    id="onotes"
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </div>

                <div className="rounded-md border p-3">
                  <button
                    type="button"
                    onClick={() => setShowTerms((s) => !s)}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    {showTerms ? "Hide" : "Read"} terms &amp; conditions
                  </button>
                  {showTerms && (
                    <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs text-muted-foreground">
                      {MERCH_TERMS}
                    </pre>
                  )}
                  <label className="mt-3 flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.accepted_terms}
                      onChange={(e) => set("accepted_terms", e.target.checked)}
                      className="mt-1"
                    />
                    I agree to the terms and conditions.
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Payment is arranged with the artist after your order is reviewed.
                </p>
              </div>
              <DialogFooter className="!flex-col gap-2 sm:!flex-row">
                <Button variant="outline" onClick={() => setStage("cart")}>
                  Back to cart
                </Button>
                <Button variant="brand" onClick={placeOrder} disabled={submitting}>
                  {submitting ? "Placing order…" : `Place order · ${formatMoney(subtotal)}`}
                </Button>
              </DialogFooter>
            </>
          )}

          {stage === "done" && confirmation && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-accent-3" />
              <DialogTitle>Order placed!</DialogTitle>
              <p className="text-sm text-muted-foreground">{confirmation.message}</p>
              <p className="font-medium">Total: {formatMoney(confirmation.total)}</p>
              <Button variant="brand" onClick={() => setStage(null)}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
