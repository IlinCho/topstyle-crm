import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";

export const metadata: Metadata = {
  title: "TopStyle.bg — Мъжка мода",
  description: "Онлайн магазин за мъжка мода — тениски, якета, дънки, ризи и още.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
