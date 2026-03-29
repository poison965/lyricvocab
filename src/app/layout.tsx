import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/toast";
import { BottomNav } from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: "LyricVocab - 兴趣驱动背单词",
  description: "通过英文歌曲学习词汇",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ToastProvider>
          {children}
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
