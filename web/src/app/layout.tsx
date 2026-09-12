import type { Metadata } from "next";
import { Poppins, Roboto, Inconsolata } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
});

const inconsolata = Inconsolata({
  variable: "--font-inconsolata",
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leads Generator Dashboard",
  description: "Clean Lead Generator System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${roboto.variable} ${inconsolata.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-text">{children}</body>
    </html>
  );
}
