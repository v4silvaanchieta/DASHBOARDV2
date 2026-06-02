import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Velot · Dashboard",
  description: "Dashboard de negócios da Velot",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      {/* A Sidebar é renderizada pela página (navegação por estado / tabs). */}
      <body className="font-sans">{children}</body>
    </html>
  );
}
