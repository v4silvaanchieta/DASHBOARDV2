import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Velot · Dashboard",
  description: "Dashboard de negócios da Velot",
  icons: {
    icon: "https://github.com/v4silvaanchieta/DASHBOARDV2/blob/main/Red-v.png?raw=true",
  },
};

// Aplica o tema salvo antes da primeira pintura (evita "flash" de tema errado).
const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem('velot-theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/* A Sidebar é renderizada pela página (navegação por estado / tabs). */}
      <body className="font-sans">{children}</body>
    </html>
  );
}
