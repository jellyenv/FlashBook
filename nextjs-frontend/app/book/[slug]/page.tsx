import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { addDays, format } from "date-fns";
import {
  CalendarHeart,
  Image as ImageIcon,
  Sparkles,
  Store,
  User,
} from "lucide-react";

import {
  getPublicArtist,
  getPublicFlash,
  getPublicPortfolio,
  getPublicProducts,
  getPublicSlots,
} from "@/app/clientService";
import { MerchStore } from "@/components/booking/MerchStore";
import { ReportIssueButton } from "@/components/ReportIssueButton";
import { eventLabel, formatFlashPrice, formatFlashSize } from "@/lib/flash";
import { FlashBookLogo } from "@/components/brand/FlashBookLogo";
import { BookingFlow, type DayAvailability } from "@/components/booking/BookingFlow";
import { Button } from "@/components/ui/button";
import { DEFAULT_MODULES, type ModuleKey } from "@/lib/booking-modules";
import { themeToStyle } from "@/lib/theme";

const NAV = {
  book: { label: "Book", icon: CalendarHeart },
  about: { label: "About", icon: User },
  portfolio: { label: "Portfolio", icon: ImageIcon },
  flash: { label: "Flash", icon: Sparkles },
  merch: { label: "Merch", icon: Store },
} as const;

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: artist, error } = await getPublicArtist({ path: { slug } });
  if (error || !artist) notFound();

  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const availability: DayAvailability[] = await Promise.all(
    dates.map(async (d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      const { data } = await getPublicSlots({ path: { slug }, query: { date: dateStr } });
      return { date: dateStr, slots: data ?? [] };
    }),
  );

  const [{ data: portfolio }, { data: flash }, { data: products }] =
    await Promise.all([
      getPublicPortfolio({ path: { slug } }),
      getPublicFlash({ path: { slug } }),
      getPublicProducts({ path: { slug } }),
    ]);

  const { style, buttonShape } = themeToStyle(artist.theme);

  // Section order/visibility from the artist's published layout (or defaults).
  const moduleList = (
    artist.modules && artist.modules.length ? artist.modules : DEFAULT_MODULES
  ) as { key: ModuleKey; enabled: boolean }[];
  const ordered = moduleList.filter((m) => m.enabled && m.key in NAV);

  const sections: Record<ModuleKey, ReactNode> = {
    book: (
      <BookingFlow
        slug={slug}
        availability={availability}
        depositCents={artist.deposit_default_cents}
        reviewFirst={artist.require_review_before_confirm}
        accepting={artist.accepting_bookings}
      />
    ),
    about: (
      <div className="rounded-[var(--radius)] border bg-card/60 p-6 text-center">
        <h2 className="mb-2 font-display text-2xl">About</h2>
        {artist.bio ? (
          <p className="mx-auto max-w-2xl text-muted-foreground">{artist.bio}</p>
        ) : (
          <p className="text-sm text-muted-foreground">More coming soon.</p>
        )}
        {artist.instagram_url && (
          <a
            href={artist.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
          >
            See more on Instagram →
          </a>
        )}
      </div>
    ),
    portfolio: (
      <div>
        <h2 className="mb-4 font-display text-2xl">Portfolio</h2>
        {portfolio && portfolio.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {portfolio.map((img) => (
              <figure
                key={img.id}
                className="overflow-hidden rounded-[var(--radius)] border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt={img.caption ?? "Tattoo by the artist"}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
                {img.caption && (
                  <figcaption className="truncate bg-card px-2 py-1 text-xs text-muted-foreground">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius)] border border-dashed bg-card/60 p-8 text-center text-sm text-muted-foreground">
            Portfolio coming soon.
          </div>
        )}
      </div>
    ),
    flash: (
      <div>
        <h2 className="mb-4 font-display text-2xl">Available flash</h2>
        {flash && flash.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {flash.map((f) => {
              const price = formatFlashPrice(f);
              const size = formatFlashSize(f);
              const tag = eventLabel(f.event_tag);
              const claimed = f.status === "claimed";
              return (
                <div
                  key={f.id}
                  className="overflow-hidden rounded-[var(--radius)] border bg-card"
                >
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.image_url}
                      alt={f.title ?? "Flash"}
                      className={`aspect-square w-full object-cover ${claimed ? "opacity-50" : ""}`}
                      loading="lazy"
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
                  </div>
                  <div className="space-y-1 p-2">
                    {f.title && (
                      <p className="truncate text-sm font-medium">{f.title}</p>
                    )}
                    <div className="text-xs">
                      {price && <span className="font-medium">{price}</span>}
                      {size && <span className="text-muted-foreground"> · {size}</span>}
                    </div>
                    {f.ask_about && !claimed ? (
                      <Button asChild size="sm" variant="brand" className="mt-1 w-full">
                        <a href="#book">Ask about this piece</a>
                      </Button>
                    ) : !claimed ? (
                      <Button asChild size="sm" variant="outline" className="mt-1 w-full">
                        <a href="#book">Book this</a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[var(--radius)] border border-dashed bg-card/60 p-8 text-center text-sm text-muted-foreground">
            No flash available right now.
          </div>
        )}
      </div>
    ),
    merch: <MerchStore slug={slug} products={products ?? []} />,
  };

  return (
    <div
      style={{ ...style, background: "var(--page-bg)" }}
      data-button-shape={buttonShape}
      className="min-h-screen"
    >
      {artist.announcement_banner && (
        <div className="bg-brand px-4 py-2 text-center text-sm font-medium text-brand-foreground">
          {artist.announcement_banner}
        </div>
      )}

      <header className="border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <FlashBookLogo size={24} />
          <nav className="flex items-center gap-4 text-sm">
            {ordered.map(({ key }) => {
              const { label, icon: Icon } = NAV[key];
              return (
                <a key={key} href={`#${key}`} className="text-muted-foreground hover:text-brand">
                  <Icon className="mr-1 inline h-4 w-4" />
                  {label}
                </a>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <section className="mb-10 text-center">
          <h1 className="font-display text-4xl">{artist.display_name}</h1>
          {artist.location && (
            <p className="mt-1 text-muted-foreground">{artist.location}</p>
          )}
        </section>

        <div className="space-y-12">
          {ordered.map(({ key }) => (
            <section key={key} id={key} className="scroll-mt-20">
              {sections[key]}
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Powered by FlashBook
      </footer>
      <ReportIssueButton role="client" />
    </div>
  );
}
