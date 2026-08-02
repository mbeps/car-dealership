import Footer from "@/components/footer";
import Header from "@/components/header";
import { getPublicBranding } from "@/actions/settings/get-public-branding";
import { DEALERSHIP_NAME } from "@/constants/dealership-name";
import { resolveIconHrefs } from "@/lib/helpers/branding";
import SupabaseProvider from "@/providers/SupabaseProvider";
import UserProvider from "@/providers/UserProvider";
import { SignInModal } from "@/components/sign-in-modal";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getPublicBranding();
  const iconHrefs = resolveIconHrefs(branding);
  const name = branding.name || DEALERSHIP_NAME;

  return {
    title: {
      default: name,
      template: `%s | ${name}`,
    },
    description: `Find your Dream Car at ${name}`,
    icons: {
      icon: iconHrefs.map((href) => ({
        url: href,
      })),
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <SupabaseProvider>
          <UserProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors />
            <Footer />
            <SignInModal />
          </UserProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
