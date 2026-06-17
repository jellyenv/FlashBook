import { PortfolioManager } from "@/components/studio/PortfolioManager";
import { fetchPortfolio } from "@/lib/studio-data";

export default async function PortfolioPage() {
  const images = await fetchPortfolio();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Portfolio</h1>
        <p className="text-muted-foreground">
          Showcase your best work. Images appear on your public booking page.
        </p>
      </div>
      <PortfolioManager images={images} />
    </div>
  );
}
