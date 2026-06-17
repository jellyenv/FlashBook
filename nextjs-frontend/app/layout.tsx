import type { Metadata } from "next";
import localFont from "next/font/local";
import { Fraunces } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FlashBook — Tattoo booking, beautifully done",
  description:
    "FlashBook is the boutique booking platform for tattoo artists and their clients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`}
      >
        <ClerkProvider
          appearance={{ theme: shadcn }}
          signInUrl="/studio/login"
          signUpUrl="/studio/register"
          signInFallbackRedirectUrl="/studio"
          signUpFallbackRedirectUrl="/studio"
        >
          {children}
          <Toaster richColors position="top-center" />
        </ClerkProvider>
      </body>
    </html>
  );
}
