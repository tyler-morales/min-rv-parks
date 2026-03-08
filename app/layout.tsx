import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const defaultTitle = "Mini RV Parks — Find Private RV Pads";
const defaultDescription =
  "Book unique private RV pads and secure RV storage from real landowners. No big parks, no crowds — just great spots.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: defaultTitle,
  description: defaultDescription,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Mini RV Parks",
    title: defaultTitle,
    description: defaultDescription,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: defaultTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <TooltipProvider>
          <Nav />
          <main>{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
