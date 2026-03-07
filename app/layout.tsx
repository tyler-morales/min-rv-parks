import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Mini RV Parks — Find Private RV Pads",
  description:
    "Book unique private RV pads and secure RV storage from real landowners. No big parks, no crowds — just great spots.",
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
