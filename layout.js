import "./globals.css";
import RegisterSW from "./register-sw";

export const metadata = {
  title: "Fluxo — Gestão da agência",
  description: "Central de tarefas e clientes da sua agência de marketing.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fluxo",
  },
};

export const viewport = {
  themeColor: "#5B47E0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
