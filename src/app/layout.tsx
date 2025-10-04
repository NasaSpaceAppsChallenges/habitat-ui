import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-expect-error CSS import in Next.js app router
import "./globals.css";
import NavBar from "@/components/NavBar";
import { JotaiProviders } from "@/components/JotaiProvider";

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
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <JotaiProviders>
          <NavBar />
          {children}
        </JotaiProviders>
      </body>
    </html>
  );
}
