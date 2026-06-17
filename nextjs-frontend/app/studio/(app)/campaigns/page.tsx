import { CampaignManager } from "@/components/studio/CampaignManager";
import { fetchCampaigns } from "@/lib/studio-data";

export default async function CampaignsPage() {
  const campaigns = await fetchCampaigns();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Campaigns</h1>
        <p className="text-muted-foreground">
          Draft announcements and specials with a link to your booking page. Sending
          by email or text turns on once messaging is connected.
        </p>
      </div>
      <CampaignManager campaigns={campaigns} />
    </div>
  );
}
