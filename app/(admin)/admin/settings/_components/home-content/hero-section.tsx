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
  form: UseFormReturn<Partial<HomePageContentFormValues>>;
  onSubmit: (data: Partial<HomePageContentFormValues>) => Promise<void>;
  onReset: () => void;
  isLoading: boolean;
}

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
