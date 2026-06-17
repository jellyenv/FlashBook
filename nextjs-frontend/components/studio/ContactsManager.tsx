"use client";

import { useState, useTransition } from "react";
import { Instagram, Mail, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createContactAction,
  deleteContactAction,
} from "@/components/actions/studio-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Contact = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  instagram?: string | null;
  notes?: string | null;
};

export function ContactsManager({ contacts }: { contacts: Contact[] }) {
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    instagram: "",
  });

  const filtered = contacts.filter((c) =>
    [c.name, c.email, c.phone, c.instagram]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  function add() {
    if (!form.name.trim()) return void toast.error("Name is required.");
    start(async () => {
      const res = await createContactAction({
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        instagram: form.instagram || null,
      });
      if (res?.error) return void toast.error(res.error);
      toast.success("Contact added");
      setForm({ name: "", phone: "", email: "", instagram: "" });
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-3">
        <Input
          placeholder="Search contacts…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search contacts"
        />
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No contacts yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((c) => (
              <li key={c.id}>
                <Card className="fb-card">
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {c.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {c.email}
                          </span>
                        )}
                        {c.instagram && (
                          <span className="flex items-center gap-1">
                            <Instagram className="h-3 w-3" /> {c.instagram}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      aria-label={`Delete ${c.name}`}
                      disabled={pending}
                      onClick={() =>
                        start(
                          async () => void (await deleteContactAction(c.id)),
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

      <Card className="fb-card h-fit">
        <CardContent className="space-y-3 p-4">
          <p className="font-display text-lg">Add contact</p>
          <div>
            <Label htmlFor="n">Name</Label>
            <Input
              id="n"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="p">Phone</Label>
            <Input
              id="p"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="e">Email</Label>
            <Input
              id="e"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="ig">Instagram</Label>
            <Input
              id="ig"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="@handle"
            />
          </div>
          <Button
            variant="brand"
            className="w-full"
            onClick={add}
            disabled={pending}
          >
            Add contact
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
