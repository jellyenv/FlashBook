"use client";

import { type CSSProperties, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ExternalLink,
  Eye,
  EyeOff,
  FlaskConical,
  GripVertical,
  Image as ImageIcon,
  Rocket,
  Save,
  Sparkles,
  Store,
} from "lucide-react";
import { toast } from "sonner";

import {
  updateBookingPageAction,
  updateProfileAction,
  updateThemeAction,
} from "@/components/actions/studio-actions";
import {
  BookingFlow,
  type DayAvailability,
} from "@/components/booking/BookingFlow";
import { ImageUpload } from "@/components/studio/ImageUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  type BookingModule,
  type ModuleKey,
  normalizeModules,
} from "@/lib/booking-modules";
import { brandPassesAA, FONT_OPTIONS, PRESET_PALETTES } from "@/lib/theme";
import { formatMoney } from "@/lib/money";
import { formatFlashPrice, formatFlashSize } from "@/lib/flash";
import { cn } from "@/lib/utils";

/* ---------------- placeholders + section previews ---------------- */

function PlaceholderTile({
  icon: Icon,
}: {
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className="flex aspect-square items-center justify-center rounded-[var(--radius)]"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--brand) / 0.16), hsl(var(--brand) / 0.04))",
      }}
    >
      <Icon className="h-7 w-7 text-brand/50" />
    </div>
  );
}

function SectionPreview({
  sectionKey,
  bio,
  instagram,
  portfolio,
  flash,
  products,
}: {
  sectionKey: ModuleKey;
  bio: string;
  instagram: string;
  portfolio: { id: string; image_url: string }[];
  flash: {
    id: string;
    image_url: string;
    title?: string | null;
    price_min_cents?: number | null;
    price_max_cents?: number | null;
    price_plus: boolean;
    size_min?: string | null;
    size_plus: boolean;
    ask_about: boolean;
  }[];
  products: {
    id: string;
    title: string;
    price_cents: number;
    images?: string[] | null;
  }[];
}) {
  if (sectionKey === "book") {
    return (
      <div className="rounded-[var(--radius)] border bg-card p-5">
        <p className="font-display text-xl">Book your session</p>
        <p className="text-sm text-muted-foreground">Pick a day and time</p>
        <div className="mt-3 flex gap-2">
          {["Mon 4", "Tue 5", "Wed 6", "Thu 7", "Fri 8"].map((d, i) => (
            <div
              key={d}
              className={cn(
                "flex w-14 flex-col items-center rounded-[var(--radius)] border px-2 py-2 text-xs",
                i === 0 && "border-brand bg-brand-soft text-brand",
              )}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM"].map((t, i) => (
            <span
              key={t}
              className={cn(
                "rounded-button border px-3 py-1 text-sm",
                i === 0 && "bg-brand text-brand-foreground",
              )}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (sectionKey === "about") {
    return (
      <div className="rounded-[var(--radius)] border bg-card/60 p-6 text-center">
        <p className="mb-2 font-display text-2xl">About</p>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          {bio || "Tell clients about your style, studio, and what to expect…"}
        </p>
        {instagram && (
          <span className="mt-3 inline-block text-sm font-medium text-brand">
            See more on Instagram →
          </span>
        )}
      </div>
    );
  }

  if (sectionKey === "portfolio") {
    const tiles = portfolio.length > 0 ? portfolio.slice(0, 6) : null;
    return (
      <div>
        <p className="mb-3 font-display text-2xl">Portfolio</p>
        <div className="grid grid-cols-3 gap-3">
          {tiles
            ? tiles.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.image_url}
                  alt=""
                  className="aspect-square w-full rounded-[var(--radius)] border object-cover"
                />
              ))
            : Array.from({ length: 6 }).map((_, i) => (
                <PlaceholderTile key={i} icon={ImageIcon} />
              ))}
        </div>
      </div>
    );
  }

  if (sectionKey === "flash") {
    const real = flash.length > 0 ? flash.slice(0, 3) : null;
    return (
      <div>
        <p className="mb-3 font-display text-2xl">Available flash</p>
        <div className="grid grid-cols-3 gap-3">
          {real
            ? real.map((f) => (
                <div
                  key={f.id}
                  className="overflow-hidden rounded-[var(--radius)] border bg-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.image_url}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                  <div className="p-1.5 text-xs">
                    {f.ask_about ? (
                      <span className="text-brand">Ask about this piece</span>
                    ) : (
                      <>
                        <span className="font-medium">
                          {formatFlashPrice(f) ?? "—"}
                        </span>
                        {formatFlashSize(f) && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {formatFlashSize(f)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            : Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-[var(--radius)] border bg-card"
                >
                  <PlaceholderTile icon={Sparkles} />
                  <div className="p-1.5 text-xs">
                    <span className="font-medium">$120+</span>
                    <span className="text-muted-foreground"> · 3&quot;</span>
                  </div>
                </div>
              ))}
        </div>
      </div>
    );
  }

  // merch
  const real = products.length > 0 ? products.slice(0, 3) : null;
  return (
    <div>
      <p className="mb-3 font-display text-2xl">Merch</p>
      <div className="grid grid-cols-3 gap-3">
        {(real
          ? real.map((p) => ({
              id: p.id,
              title: p.title,
              price: formatMoney(p.price_cents),
              img: p.images?.[0],
            }))
          : [
              {
                id: "a",
                title: "Flash print — A4",
                price: "$25",
                img: undefined,
              },
              { id: "b", title: "Sticker pack", price: "$8", img: undefined },
              { id: "c", title: "Studio tee", price: "$30", img: undefined },
            ]
        ).map((p) => (
          <div
            key={p.id}
            className="overflow-hidden rounded-[var(--radius)] border bg-card"
          >
            {p.img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.img}
                alt=""
                className="aspect-square w-full object-cover"
              />
            ) : (
              <PlaceholderTile icon={Store} />
            )}
            <div className="space-y-1 p-1.5">
              <p className="truncate text-xs font-medium">{p.title}</p>
              <p className="text-xs font-semibold">{p.price}</p>
              <span className="block rounded-button bg-brand px-2 py-1 text-center text-[10px] text-brand-foreground">
                Add to cart
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- sortable wrapper ---------------- */

function SortableSection({
  module,
  onToggle,
  children,
}: {
  module: BookingModule;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.key });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : module.enabled ? 1 : 0.45,
      }}
      className="group relative"
    >
      <div className="absolute -left-2.5 top-2 z-10 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab touch-none rounded-md border bg-background p-1 shadow"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          onClick={onToggle}
          aria-label={module.enabled ? "Hide section" : "Show section"}
          className="rounded-md border bg-background p-1 shadow"
        >
          {module.enabled ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="rounded-[var(--radius)] transition-all group-hover:ring-2 group-hover:ring-brand/40 group-hover:ring-offset-2">
        {children}
      </div>
      {!module.enabled && (
        <span className="absolute right-2 top-2 rounded-full bg-foreground/70 px-2 py-0.5 text-xs text-background">
          Hidden
        </span>
      )}
    </div>
  );
}

/* ---------------- main editor ---------------- */

type Layout = {
  draft?: { key: string; enabled?: boolean }[] | null;
  modules?: { key: string; enabled?: boolean }[] | null;
  published?: boolean;
  announcement_banner?: string | null;
  announcement_active?: boolean;
} | null;

export function BookingPageEditor({
  slug,
  layout,
  theme,
  profile,
  portfolio,
  flash,
  products,
  availability,
}: {
  slug: string;
  layout: Layout;
  theme: {
    palette?: { brand?: string } | null;
    button_shape?: "rounded" | "sharp" | null;
    background_color?: string | null;
    background_image_url?: string | null;
    font?: string | null;
  } | null;
  profile: {
    display_name: string;
    location?: string | null;
    bio?: string | null;
    instagram_url?: string | null;
    deposit_default_cents: number;
    require_review_before_confirm: boolean;
  } | null;
  portfolio: { id: string; image_url: string }[];
  flash: React.ComponentProps<typeof SectionPreview>["flash"];
  products: React.ComponentProps<typeof SectionPreview>["products"];
  availability: DayAvailability[];
}) {
  const [pending, start] = useTransition();
  const [modules, setModules] = useState<BookingModule[]>(
    normalizeModules(layout?.draft ?? layout?.modules),
  );
  const [banner, setBanner] = useState(layout?.announcement_banner ?? "");
  const [bannerActive, setBannerActive] = useState(
    layout?.announcement_active ?? false,
  );
  const [published, setPublished] = useState(layout?.published ?? false);

  const [brand, setBrand] = useState(theme?.palette?.brand ?? "343 81% 62%");
  const [shape, setShape] = useState<"rounded" | "sharp">(
    theme?.button_shape ?? "rounded",
  );
  const [bgColor, setBgColor] = useState(theme?.background_color ?? "");
  const [bgImage, setBgImage] = useState(theme?.background_image_url ?? "");
  const [font, setFont] = useState(theme?.font ?? FONT_OPTIONS[0].stack);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [instagram, setInstagram] = useState(profile?.instagram_url ?? "");

  const [testOpen, setTestOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setModules((items) =>
        arrayMove(
          items,
          items.findIndex((m) => m.key === active.id),
          items.findIndex((m) => m.key === over.id),
        ),
      );
    }
  }

  const toggle = (key: string) =>
    setModules((items) =>
      items.map((m) => (m.key === key ? { ...m, enabled: !m.enabled } : m)),
    );

  function save(publish: boolean) {
    start(async () => {
      const r1 = await updateThemeAction({
        palette: { brand },
        button_shape: shape,
        background_color: bgColor || null,
        background_image_url: bgImage || null,
        font: font || null,
      });
      const r2 = await updateProfileAction({
        display_name: displayName || undefined,
        location: location || null,
        bio: bio || null,
        instagram_url: instagram || null,
      });
      const r3 = await updateBookingPageAction({
        draft: modules,
        announcement_banner: banner || null,
        announcement_active: bannerActive,
        publish,
      });
      const err = r1?.error || r2?.error || r3?.error;
      if (err) return void toast.error(err);
      if (publish) setPublished(true);
      toast.success(publish ? "Published! Your page is live." : "Saved");
    });
  }

  const canvasStyle: CSSProperties = {
    ["--brand" as string]: brand,
    fontFamily: font || undefined,
    background: bgImage
      ? `${bgColor ? bgColor + " " : ""}url('${bgImage}') center / cover no-repeat`
      : bgColor || "hsl(var(--background))",
    color: "hsl(var(--foreground))",
  };

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="brand" onClick={() => save(true)} disabled={pending}>
          <Rocket className="mr-2 h-4 w-4" /> Save &amp; publish
        </Button>
        <Button
          variant="outline"
          onClick={() => save(false)}
          disabled={pending}
        >
          <Save className="mr-2 h-4 w-4" /> Save draft
        </Button>
        <Button variant="outline" onClick={() => setTestOpen(true)}>
          <FlaskConical className="mr-2 h-4 w-4" /> Test booking
        </Button>
        {slug && (
          <Button asChild variant="ghost">
            <Link href={`/book/${slug}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" /> View live
            </Link>
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {published ? "Published" : "Not published yet"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* controls */}
        <div className="space-y-4">
          <Card className="fb-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">
                Look & feel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Accent color</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRESET_PALETTES.map((p) => (
                    <button
                      key={p.name}
                      aria-label={p.name}
                      onClick={() => setBrand(p.brand)}
                      className={cn(
                        "h-7 w-7 rounded-full border-2",
                        brand === p.brand
                          ? "border-foreground"
                          : "border-transparent",
                      )}
                      style={{ background: `hsl(${p.brand})` }}
                    />
                  ))}
                </div>
                {!brandPassesAA(brand) && (
                  <p className="mt-1 text-xs text-amber-600">
                    White text on this color may fail AA contrast.
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs">Button shape</Label>
                <div className="mt-1 flex gap-2">
                  {(["rounded", "sharp"] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={shape === s ? "brand" : "outline"}
                      onClick={() => setShape(s)}
                      className="capitalize"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="font" className="text-xs">
                  Font
                </Label>
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
            </CardContent>
          </Card>

          <Card className="fb-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">
                Background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ImageUpload
                currentUrl={bgImage || undefined}
                onUploaded={setBgImage}
                label="Upload background image"
              />
              <Input
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                placeholder="Background color (e.g. #fdf6f8)"
              />
              {bgImage && (
                <button
                  onClick={() => setBgImage("")}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove background image
                </button>
              )}
            </CardContent>
          </Card>

          <Card className="fb-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">
                Profile & text
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="dn" className="text-xs">
                  Display name
                </Label>
                <Input
                  id="dn"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="loc" className="text-xs">
                  Location
                </Label>
                <Input
                  id="loc"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bio" className="text-xs">
                  About / bio
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ig" className="text-xs">
                  Instagram URL
                </Label>
                <Input
                  id="ig"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="fb-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">
                Announcement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder="Books open Nov 1 · flash specials all month!"
              />
              <div className="flex items-center justify-between rounded-md border p-2">
                <Label htmlFor="ba" className="text-xs">
                  Show banner
                </Label>
                <Switch
                  id="ba"
                  checked={bannerActive}
                  onCheckedChange={setBannerActive}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* live canvas */}
        <div className="overflow-hidden rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 border-b bg-muted px-3 py-2">
            <div className="flex gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent-3/70" />
            </div>
            <div className="flex-1 truncate rounded-full bg-background px-3 py-1 text-center text-xs text-muted-foreground">
              flashbook.app/book/{slug || "your-slug"}
            </div>
          </div>
          <div
            style={canvasStyle}
            data-button-shape={shape}
            className="max-h-[72vh] overflow-y-auto"
          >
            {bannerActive && banner && (
              <div className="bg-brand px-4 py-2 text-center text-sm font-medium text-brand-foreground">
                {banner}
              </div>
            )}
            <div className="px-5 py-6">
              <div className="mb-8 text-center">
                <h1 className="font-display text-3xl">
                  {displayName || "Your name"}
                </h1>
                {location && (
                  <p className="mt-1 text-muted-foreground">{location}</p>
                )}
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={modules.map((m) => m.key)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-8">
                    {modules.map((m) => (
                      <SortableSection
                        key={m.key}
                        module={m}
                        onToggle={() => toggle(m.key)}
                      >
                        <SectionPreview
                          sectionKey={m.key}
                          bio={bio}
                          instagram={instagram}
                          portfolio={portfolio}
                          flash={flash}
                          products={products}
                        />
                      </SortableSection>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Simulated booking test</DialogTitle>
            <DialogDescription>
              A dry-run with your real availability — nothing is actually
              booked.
            </DialogDescription>
          </DialogHeader>
          <BookingFlow
            slug={slug}
            availability={availability}
            depositCents={profile?.deposit_default_cents ?? 5000}
            reviewFirst={profile?.require_review_before_confirm ?? true}
            accepting
            testMode
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
