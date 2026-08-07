import { UseFormReturn } from "react-hook-form";
import { Save, Loader2, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HomePageContentFormValues } from "@/schemas/home-content";

interface HeroSectionProps {
  /** Shared form state for home content values. */
  form: UseFormReturn<Partial<HomePageContentFormValues>>;
  /** Save callback for hero content. */
  onSubmit: (data: Partial<HomePageContentFormValues>) => Promise<void>;
  /** Reset callback for hero fields. */
  onReset: () => void;
  /** Whether the form is currently saving. */
  isLoading: boolean;
}

/**
 * Reusable editor for homepage hero copy.
 * Provides title and subtitle fields with maxlength validation.
 *
 * @param form - Shared form state for home content values
 * @param onSubmit - Save callback for hero content
 * @param onReset - Reset callback for hero fields
 * @param isLoading - Whether the form is currently saving
 * @returns Hero content editor
 * @see CTASection - Homepage CTA editor
 * @see FeaturesSection - Homepage features editor
 */
export const HeroSection = ({
  form,
  onSubmit,
  onReset,
  isLoading,
}: HeroSectionProps) => {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
          <CardDescription>
            Update the main title and subtitle shown at the top of the home
            page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heroTitle">Hero Title</Label>
              <Input
                id="heroTitle"
                {...form.register("heroTitle")}
                maxLength={40}
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.watch("heroTitle")?.length || 0}/40
              </p>
              {form.formState.errors.heroTitle && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.heroTitle.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
              <Input
                id="heroSubtitle"
                {...form.register("heroSubtitle")}
                maxLength={80}
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.watch("heroSubtitle")?.length || 0}/80
              </p>
              {form.formState.errors.heroSubtitle && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.heroSubtitle.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              disabled={isLoading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Hero
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};
