"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updatePassword } from "@/actions/auth";
import { updatePasswordSchema } from "@/lib/schemas";

/**
 * Update password page for setting new password after reset.
 * User arrives here via email link with authentication token.
 * Validates password matching and updates via Supabase.
 *
 * @returns Update password form page
 * @see updatePassword - Server action that updates password
 * @see updatePasswordSchema - Zod validation schema with password matching
 * @see ROUTES.SIGN_IN - Redirect destination after successful update
 */
export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  /**
   * Handles password update form submission.
   * Validates password matching and calls server action to update password.
   * Redirects to sign-in page on success.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate input
      const validation = updatePasswordSchema.safeParse({
        password,
        confirmPassword,
      });

      if (!validation.success) {
        setError(validation.error.errors[0].message);
        return;
      }

      const result = await updatePassword(password);

      if (!result.success) {
        setError(result.error || "Failed to update password");
        return;
      }

      // Redirect to sign-in page with success message
      router.push(ROUTES.SIGN_IN);
    } catch (error) {
      setError("An unexpected error occurred");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Set new password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Update password"
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
