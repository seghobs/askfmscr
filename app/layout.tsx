import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AppProvider } from "./context";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ASK.fm - Merak Ettiklerini Sor",
  description: "Sorular sor, yanıtlar al, arkadaşlarınla ve anonim kullanıcılarla etkileşime geç. Modern, şık ve hızlı sosyal medya platformu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={outfit.variable}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
