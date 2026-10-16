"use client";

import {
  AlertCircle,
  Car,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { useOAuthConsent } from "@/hooks/use-oauth-consent";

export interface OAuthConsentCardProps {
  authorizationId: string | null;
}

export function OAuthConsentCard({ authorizationId }: OAuthConsentCardProps) {
  const {
    status,
    actionType,
    error,
    details,
    userEmail,
    handleApprove,
    handleDeny,
  } = useOAuthConsent({ authorizationId });

  if (status === "loading") {
    return (
      <Card className="w-full max-w-md shadow-md">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-600" />
          <p className="font-medium text-gray-700 text-sm">
            Loading authorization details...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === "redirecting") {
    return (
      <Card className="w-full max-w-md shadow-md">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-600" />
          <p className="font-medium text-gray-700 text-sm">
            Redirecting back to {details?.client.name || "application"}...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === "error" || !details) {
    return (
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="font-bold text-gray-900 text-xl">
            Authorization Failed
          </CardTitle>
          <CardDescription>
            We were unable to complete your authorization request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="text-xs">
              {error || "An unknown authorization error occurred."}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            render={<Link href={ROUTES.HOME.HOME}>Return to Home</Link>}
            nativeButton={false}
            variant="outline"
            className="w-full"
          />
        </CardFooter>
      </Card>
    );
  }

  const clientName = details.client.name || "External Application";
  const clientUri = details.client.uri;

  return (
    <Card className="w-full max-w-md border-gray-200 shadow-md">
      <CardHeader className="pb-4 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="font-bold text-2xl text-gray-900">
          Authorize Access
        </CardTitle>
        <CardDescription className="text-sm">
          <span className="font-semibold text-gray-900">{clientName}</span> is
          requesting access to your Vehiql account.
        </CardDescription>

        {clientUri && (
          <div className="mt-2 flex items-center justify-center gap-1 text-gray-500 text-xs">
            <Globe className="h-3.5 w-3.5" />
            <a
              href={clientUri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-blue-600 hover:underline"
            >
              {clientUri}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {userEmail && (
          <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 font-medium text-white text-xs">
                {userEmail[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="text-left">
                <p className="text-gray-500 text-xs">Connecting as</p>
                <p className="max-w-[200px] truncate font-medium text-gray-800 text-xs">
                  {userEmail}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Active User
            </Badge>
          </div>
        )}

        <div className="space-y-2">
          <p className="font-medium text-gray-700 text-xs uppercase tracking-wider">
            Permissions Requested
          </p>
          <ul className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-gray-600 text-xs">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                Search and explore vehicle inventory, pricing, and specs
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>Book, view, and reschedule car test drive bookings</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>Manage saved cars wishlist and profile preferences</span>
            </li>
            <li className="flex items-start gap-2">
              <Car className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <span>
                Execute dealership tools according to your account role
              </span>
            </li>
          </ul>
        </div>

        {error && (
          <Alert variant="destructive" className="py-2 text-xs">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <p className="text-center text-[11px] text-gray-500">
          You can revoke access to this application at any time in your account
          settings.
        </p>
      </CardContent>

      <CardFooter className="flex gap-3 pt-2">
        <Button
          variant="outline"
          className="w-1/2"
          onClick={handleDeny}
          disabled={status === "submitting"}
        >
          {status === "submitting" && actionType === "deny" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Denying...
            </>
          ) : (
            "Deny"
          )}
        </Button>
        <Button
          className="w-1/2 bg-blue-600 hover:bg-blue-700"
          onClick={handleApprove}
          disabled={status === "submitting"}
        >
          {status === "submitting" && actionType === "approve" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authorizing...
            </>
          ) : (
            "Allow Access"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
