import { BookingPageEditor } from "@/components/studio/BookingPageEditor";
import {
  fetchAvailabilityPreview,
  fetchBookingLayout,
  fetchFlash,
  fetchMyProfile,
  fetchPortfolio,
  fetchProducts,
  fetchTheme,
} from "@/lib/studio-data";

export default async function BookingPageEditorPage() {
  const [layout, profile, theme, portfolio, flash, products] =
    await Promise.all([
      fetchBookingLayout(),
      fetchMyProfile(),
      fetchTheme(),
      fetchPortfolio(),
      fetchFlash(),
      fetchProducts(),
    ]);
  const slug = profile?.slug ?? "";
  const availability = slug ? await fetchAvailabilityPreview(slug) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Booking page editor</h1>
        <p className="text-muted-foreground">
          Edit your live page — drag sections, change colors &amp; text, then
          publish.
        </p>
      </div>
      <BookingPageEditor
        slug={slug}
        layout={layout}
        theme={theme}
        profile={profile}
        portfolio={portfolio}
        flash={flash}
        products={products}
        availability={availability}
      />
    </div>
  );
}
