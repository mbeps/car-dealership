import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { OAuthConsentCard } from "./_components/oauth-consent-card";

export const metadata: Metadata = {
  title: "Authorize Application | Vehiql",
  description:
    "Authorize an external application to connect to your Vehiql account.",
};

interface OAuthConsentPageProps {
  searchParams: Promise<{ authorization_id?: string }>;
}

async function ConsentContent({ searchParams }: OAuthConsentPageProps) {
  const resolvedParams = await searchParams;
  const authorizationId = resolvedParams.authorization_id || null;

  return <OAuthConsentCard authorizationId={authorizationId} />;
}

export default function OAuthConsentPage({
  searchParams,
}: OAuthConsentPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-600" />
            <p className="font-medium text-gray-700 text-sm">
              Loading consent screen...
            </p>
          </div>
        }
      >
        <ConsentContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
