import type { Metadata, Viewport } from "next";
import { Geist, Borel } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const borel = Borel({
  weight: "400",
  variable: "--font-borel",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "findln",
  description:
    "Secondhand Kinderartikel in deiner Nachbarschaft — verschenken, verleihen, weitergeben.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${borel.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
