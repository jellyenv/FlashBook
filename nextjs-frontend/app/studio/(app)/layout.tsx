import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { FlashBookLogo } from "@/components/brand/FlashBookLogo";
import { ReportIssueButton } from "@/components/ReportIssueButton";
import { PenNav } from "@/components/studio/PenNav";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
import { fetchMyProfile, syncClerkProfile } from "@/lib/studio-data";

export default async function StudioAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/studio/login");

  // Enrich the local profile with the real Clerk email/name (idempotent), then load it.
  await syncClerkProfile(user.email, user.full_name);
  const profile = await fetchMyProfile();

  return (
    <div className="min-h-screen bg-muted/30">
      <a
        href="#studio-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <PenNav />
            <Link href="/studio" aria-label="FlashBook home">
              <FlashBookLogo />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {profile?.slug && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/book/${profile.slug}`} target="_blank">
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Booking page
                </Link>
              </Button>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                  userButtonPopoverRootBox: "z-[70]",
                  userButtonPopoverCard:
                    "z-[70] bg-popover text-popover-foreground border shadow-xl",
                  userButtonPopoverMain: "bg-popover",
                  userButtonPopoverFooter: "bg-popover",
                  userButtonPopoverActionButton: "hover:bg-accent",
                },
              }}
            />
          </div>
        </div>
      </header>
      <main id="studio-main" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
      <ReportIssueButton role="artist" />
    </div>
  );
}
