import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/nav";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "MyDay",
  description: "Dein persoenlicher Tagesplaner",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MyDay",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white font-sans">
        <AuthProvider>
          <Nav />
          <ServiceWorkerRegister />
          <main className="flex-1 pb-20">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
