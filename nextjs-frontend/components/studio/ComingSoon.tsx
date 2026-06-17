import { FlashBookLogo } from "@/components/brand/FlashBookLogo";

export function ComingSoon({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{title}</h1>
      <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-dashed bg-card py-20 text-center">
        <FlashBookLogo markOnly size={44} />
        <p className="text-lg font-medium">Coming soon</p>
        <p className="max-w-md text-sm text-muted-foreground">{blurb}</p>
      </div>
    </div>
  );
}
