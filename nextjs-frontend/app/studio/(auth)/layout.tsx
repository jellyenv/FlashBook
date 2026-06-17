import Link from "next/link";

import { FlashBookLogo } from "@/components/brand/FlashBookLogo";

export default function StudioAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-soft via-background to-background px-4 py-10">
      <Link href="/" className="mb-8">
        <FlashBookLogo size={34} />
      </Link>
      <main className="w-full max-w-md">{children}</main>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        For tattoo artists & studios · boutique booking, beautifully done
      </p>
    </div>
  );
}
