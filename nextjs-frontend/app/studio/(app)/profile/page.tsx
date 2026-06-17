import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { ProfileEditor } from "@/components/studio/ProfileEditor";
import { Button } from "@/components/ui/button";
import { fetchMyProfile, fetchTheme } from "@/lib/studio-data";

export default async function ProfilePage() {
  const [profile, theme] = await Promise.all([fetchMyProfile(), fetchTheme()]);
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Artist profile</h1>
          <p className="text-muted-foreground">
            Your public details, booking policy, and theme.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/book/${profile.slug}`} target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" /> View booking page
          </Link>
        </Button>
      </div>
      <ProfileEditor profile={profile} theme={theme} />
    </div>
  );
}
