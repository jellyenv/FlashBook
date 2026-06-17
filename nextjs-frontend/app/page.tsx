import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { CalendarHeart, Palette, ShieldCheck, Sparkles } from "lucide-react";

import { FlashBookLogo } from "@/components/brand/FlashBookLogo";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-soft via-background to-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <FlashBookLogo size={30} />
        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost">Sign in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="brand">Start free</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Button asChild variant="ghost">
              <Link href="/studio">My studio</Link>
            </Button>
            <UserButton />
          </Show>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-brand">
          For tattoo artists & studios
        </p>
        <h1 className="font-display text-5xl leading-tight md:text-6xl">
          Boutique booking, beautifully done.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          FlashBook gives tattoo artists a clean calendar, a stunning booking page,
          flash & merch storefronts, and built-in messaging — all in one place.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="brand" size="lg">
            <Link href="/studio/register">Create your studio</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/studio/login">I already have an account</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: CalendarHeart, title: "Smart calendar", body: "Day, week & month views with hour-by-hour control." },
          { icon: Sparkles, title: "Your flash & merch", body: "Showcase available pieces and sell merch with checkout." },
          { icon: Palette, title: "Make it yours", body: "Custom colors, fonts, and button shapes that save." },
          { icon: ShieldCheck, title: "Safe & sound", body: "2FA, email verification, and secure payments." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="fb-card p-5">
            <Icon className="mb-3 h-6 w-6 text-brand" />
            <h3 className="font-display text-lg">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
