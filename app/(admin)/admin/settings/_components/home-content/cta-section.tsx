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

interface CTASectionProps {
  form: UseFormReturn<Partial<HomePageContentFormValues>>;
  onSubmit: (data: Partial<HomePageContentFormValues>) => Promise<void>;
  onReset: () => void;
  isLoading: boolean;
}

export const CTASection = ({
  form,
  onSubmit,
  onReset,
  isLoading,
}: CTASectionProps) => {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Call to Action Section</CardTitle>
          <CardDescription>
            Update the text for the "Ready to Find Your Dream Car?" section at
            the bottom.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ctaTitle">CTA Title</Label>
              <Input
                id="ctaTitle"
                {...form.register("ctaTitle")}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.watch("ctaTitle")?.length || 0}/50
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaSubtitle">CTA Subtitle</Label>
              <Input
                id="ctaSubtitle"
                {...form.register("ctaSubtitle")}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.watch("ctaSubtitle")?.length || 0}/200
              </p>
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
              Save CTA
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};
