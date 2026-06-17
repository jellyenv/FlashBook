"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";

import {
  updateProfileAction,
  updateThemeAction,
} from "@/components/actions/studio-actions";
import { ImageUpload } from "@/components/studio/ImageUpload";
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
import { brandPassesAA, FONT_OPTIONS, PRESET_PALETTES } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Profile = {
  display_name: string;
  business_name?: string | null;
  bio?: string | null;
  location?: string | null;
  instagram_handle?: string | null;
  instagram_url?: string | null;
  deposit_default_cents: number;
  default_slot_minutes: number;
  require_review_before_confirm: boolean;
  accepting_bookings: boolean;
};

type Theme = {
  palette?: { brand?: string } | null;
  button_shape?: "rounded" | "sharp" | null;
  background_color?: string | null;
  background_image_url?: string | null;
  font?: string | null;
} | null;

export function ProfileEditor({
  profile,
  theme,
}: {
  profile: Profile;
  theme: Theme;
}) {
  const [pending, start] = useTransition();
  const [p, setP] = useState({
    display_name: profile.display_name,
    business_name: profile.business_name ?? "",
    bio: profile.bio ?? "",
    location: profile.location ?? "",
    instagram_handle: profile.instagram_handle ?? "",
    instagram_url: profile.instagram_url ?? "",
    deposit: (profile.deposit_default_cents / 100).toString(),
    default_slot_minutes: profile.default_slot_minutes,
    require_review_before_confirm: profile.require_review_before_confirm,
    accepting_bookings: profile.accepting_bookings,
  });

  const [brand, setBrand] = useState(theme?.palette?.brand ?? "343 81% 62%");
  const [shape, setShape] = useState<"rounded" | "sharp">(
    theme?.button_shape ?? "rounded",
  );
  const [bg, setBg] = useState(theme?.background_color ?? "");
  const [bgImage, setBgImage] = useState(theme?.background_image_url ?? "");
  const [font, setFont] = useState(theme?.font ?? FONT_OPTIONS[0].stack);

  const contrastOk = brandPassesAA(brand);

  function saveProfile() {
    start(async () => {
      const res = await updateProfileAction({
        display_name: p.display_name,
        business_name: p.business_name || null,
        bio: p.bio || null,
        location: p.location || null,
        instagram_handle: p.instagram_handle || null,
        instagram_url: p.instagram_url || null,
        deposit_default_cents: Math.round(parseFloat(p.deposit || "0") * 100),
        default_slot_minutes: p.default_slot_minutes,
        require_review_before_confirm: p.require_review_before_confirm,
        accepting_bookings: p.accepting_bookings,
      });
      if (res?.error) return void toast.error(res.error);
      toast.success("Profile saved");
    });
  }

  function saveTheme() {
    start(async () => {
      const res = await updateThemeAction({
        palette: { brand },
        button_shape: shape,
        background_color: bg || null,
        background_image_url: bgImage || null,
        font: font || null,
      });
      if (res?.error) return void toast.error(res.error);
      toast.success("Theme saved");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profile + policy */}
      <Card className="fb-card">
        <CardHeader>
          <CardTitle className="font-display">Details & policy</CardTitle>
          <CardDescription>
            What clients see and how booking works
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="dn">Display name</Label>
            <Input
              id="dn"
              value={p.display_name}
              onChange={(e) => setP({ ...p, display_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="bn">Business name</Label>
            <Input
              id="bn"
              value={p.business_name}
              onChange={(e) => setP({ ...p, business_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={p.bio}
              onChange={(e) => setP({ ...p, bio: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="loc">Location</Label>
              <Input
                id="loc"
                value={p.location}
                onChange={(e) => setP({ ...p, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="igh">Instagram handle</Label>
              <Input
                id="igh"
                value={p.instagram_handle}
                onChange={(e) =>
                  setP({ ...p, instagram_handle: e.target.value })
                }
                placeholder="@you"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="igu">Instagram URL</Label>
            <Input
              id="igu"
              value={p.instagram_url}
              onChange={(e) => setP({ ...p, instagram_url: e.target.value })}
              placeholder="https://instagram.com/you"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dep">Default deposit ($)</Label>
              <Input
                id="dep"
                type="number"
                min={0}
                step="0.01"
                value={p.deposit}
                onChange={(e) => setP({ ...p, deposit: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="slot">Default slot (mins)</Label>
              <Input
                id="slot"
                type="number"
                min={15}
                step={15}
                value={p.default_slot_minutes}
                onChange={(e) =>
                  setP({ ...p, default_slot_minutes: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="rev">Review requests before confirming</Label>
              <p className="text-xs text-muted-foreground">
                Clients see &ldquo;request is being reviewed&rdquo; until you
                approve.
              </p>
            </div>
            <Switch
              id="rev"
              checked={p.require_review_before_confirm}
              onCheckedChange={(v) =>
                setP({ ...p, require_review_before_confirm: v })
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="acc">Accepting bookings</Label>
            <Switch
              id="acc"
              checked={p.accepting_bookings}
              onCheckedChange={(v) => setP({ ...p, accepting_bookings: v })}
            />
          </div>
          <Button
            variant="brand"
            className="w-full"
            onClick={saveProfile}
            disabled={pending}
          >
            Save profile
          </Button>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="fb-card" style={{ ["--brand" as string]: brand }}>
        <CardHeader>
          <CardTitle className="font-display">Theme</CardTitle>
          <CardDescription>Customize your booking page look</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-button-shape={shape}>
          <div>
            <Label>Accent color</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESET_PALETTES.map((pal) => (
                <button
                  key={pal.name}
                  onClick={() => setBrand(pal.brand)}
                  aria-label={pal.name}
                  className={cn(
                    "h-8 w-8 rounded-full border-2",
                    brand === pal.brand
                      ? "border-foreground"
                      : "border-transparent",
                  )}
                  style={{ background: `hsl(${pal.brand})` }}
                />
              ))}
            </div>
            {!contrastOk && (
              <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" /> White text on this color
                may fail WCAG AA contrast.
              </p>
            )}
          </div>

          <div>
            <Label>Button shape</Label>
            <div className="mt-2 flex gap-2">
              {(["rounded", "sharp"] as const).map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={shape === s ? "brand" : "outline"}
                  size="sm"
                  onClick={() => setShape(s)}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="font">Font</Label>
            <select
              id="font"
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.name} value={f.stack}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="bg">Background color (CSS, optional)</Label>
            <Input
              id="bg"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              placeholder="#fdf6f8 or hsl(...)"
            />
          </div>

          <div className="space-y-2">
            <Label>Background image (optional)</Label>
            <ImageUpload
              currentUrl={bgImage || undefined}
              onUploaded={setBgImage}
              label="Upload a background image"
            />
            <Input
              id="bgimg"
              value={bgImage}
              onChange={(e) => setBgImage(e.target.value)}
              placeholder="…or paste an image URL"
            />
            {bgImage && (
              <button
                type="button"
                onClick={() => setBgImage("")}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Remove background image
              </button>
            )}
          </div>

          {/* Live preview */}
          <div
            className="rounded-[var(--radius)] border p-4"
            style={{
              background: bgImage
                ? `${bg ? bg + " " : ""}url('${bgImage}') center / cover no-repeat`
                : bg || "hsl(var(--background))",
              fontFamily: font,
            }}
          >
            <p className="mb-2 text-sm font-medium">Preview</p>
            <Button variant="brand" className="rounded-button">
              <Check className="mr-1 h-4 w-4" /> Book now
            </Button>
          </div>

          <Button
            variant="brand"
            className="w-full"
            onClick={saveTheme}
            disabled={pending}
          >
            Save theme
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
