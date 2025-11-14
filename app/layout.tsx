import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Car Dealership",
  description: "Find your Dream Car",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo-white.png" sizes="any" />
      </head>
      <body className={`${inter.className}`}>
        <AuthProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Toaster richColors />

          <footer className="bg-blue-50 py-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>Made with 💗 by RoadsideCoder</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
