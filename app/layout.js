import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Velot · Dashboard",
  description: "Dashboard de negócios da Velot",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans">
        <div className="min-h-screen">
          <Sidebar />
          {/* Conteúdo deslocado para a direita da sidebar fixa (md:pl-64) */}
          <div className="md:pl-64">{children}</div>
        </div>
      </body>
    </html>
  );
}
