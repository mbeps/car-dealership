import { Loader2, RotateCcw, Save } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HomePageContentFormValues } from "@/schemas/home-content";

interface FeaturesSectionProps {
  /** Shared form state for home content values. */
  form: UseFormReturn<Partial<HomePageContentFormValues>>;
  /** Save callback for feature content. */
  onSubmit: (data: Partial<HomePageContentFormValues>) => Promise<void>;
  /** Reset callback for feature fields. */
  onReset: () => void;
  /** Whether the form is currently saving. */
  isLoading: boolean;
}

/**
 * Reusable editor for three homepage feature cards.
 * Provides paired title and description fields with maxlength validation.
 *
 * @param form - Shared form state for home content values
 * @param onSubmit - Save callback for feature content
 * @param onReset - Reset callback for feature fields
 * @param isLoading - Whether the form is currently saving
 * @returns Features content editor
 * @see HeroSection - Homepage hero editor
 * @see CTASection - Homepage CTA editor
 */
export const FeaturesSection = ({
  form,
  onSubmit,
  onReset,
  isLoading,
}: FeaturesSectionProps) => {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Features Section</CardTitle>
          <CardDescription>
            Manage the three feature highlights shown in the "Why Choose Us"
            section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="font-semibold text-base">Feature 1</Label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="feature1Title">Title</Label>
                <Input
                  id="feature1Title"
                  placeholder="Title"
                  {...form.register("feature1Title")}
                  maxLength={30}
                />
                <p className="text-right text-muted-foreground text-xs">
                  {form.watch("feature1Title")?.length || 0}/30
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feature1Description">Description</Label>
                <Input
                  id="feature1Description"
                  placeholder="Description"
                  {...form.register("feature1Description")}
                  maxLength={150}
                />
                <p className="text-right text-muted-foreground text-xs">
                  {form.watch("feature1Description")?.length || 0}/150
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="font-semibold text-base">Feature 2</Label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="feature2Title">Title</Label>
                <Input
                  id="feature2Title"
                  placeholder="Title"
                  {...form.register("feature2Title")}
                  maxLength={30}
                />
                <p className="text-right text-muted-foreground text-xs">
                  {form.watch("feature2Title")?.length || 0}/30
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feature2Description">Description</Label>
                <Input
                  id="feature2Description"
                  placeholder="Description"
                  {...form.register("feature2Description")}
                  maxLength={150}
                />
                <p className="text-right text-muted-foreground text-xs">
                  {form.watch("feature2Description")?.length || 0}/150
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="font-semibold text-base">Feature 3</Label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="feature3Title">Title</Label>
                <Input
                  id="feature3Title"
                  placeholder="Title"
                  {...form.register("feature3Title")}
                  maxLength={30}
                />
                <p className="text-right text-muted-foreground text-xs">
                  {form.watch("feature3Title")?.length || 0}/30
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feature3Description">Description</Label>
                <Input
                  id="feature3Description"
                  placeholder="Description"
                  {...form.register("feature3Description")}
                  maxLength={150}
                />
                <p className="text-right text-muted-foreground text-xs">
                  {form.watch("feature3Description")?.length || 0}/150
                </p>
              </div>
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
              Save Features
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};
