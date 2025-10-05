import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { JotaiProviders } from "@/components/JotaiProvider";
import Script from "next/script";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NASA Space Craft Builder",
  description: "Design e construa sua nave espacial para explorar o universo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
				<Script
					src="https://unpkg.com/@rive-app/canvas@2.24.0"
					strategy="beforeInteractive"
				/>
        <JotaiProviders>
          {children}
        </JotaiProviders>
      </body>
    </html>
  );
}
