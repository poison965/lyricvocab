import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="zh">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
