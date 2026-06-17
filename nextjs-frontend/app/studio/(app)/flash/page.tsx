import { FlashManager } from "@/components/studio/FlashManager";
import { fetchFlash } from "@/lib/studio-data";

export default async function FlashPage() {
  const pieces = await fetchFlash();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Flash editor</h1>
        <p className="text-muted-foreground">
          Post available flash with price &amp; size ranges, mark pieces
          claimed, or invite a consult with &ldquo;Ask about this piece.&rdquo;
        </p>
      </div>
      <FlashManager pieces={pieces} />
    </div>
  );
}
