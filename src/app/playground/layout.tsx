import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  const fontClassName = `${geistSans.variable} ${geistMono.variable}`;

  return (
    <div className={fontClassName}>
		<JotaiProviders>
			{children}
		</JotaiProviders>
    </div>
  );
}
