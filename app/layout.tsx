import Footer from "@/components/footer";
import Header from "@/components/header";
import { DEALERSHIP_NAME } from "@/constants/dealership-name";
import { AuthProvider } from "@/lib/auth-context";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: DEALERSHIP_NAME,
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

          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
