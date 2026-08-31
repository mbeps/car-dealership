"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface CarFeaturesInputProps {
  features?: string[];
  onChange: (features: string[]) => void;
}

/**
 * Feature tag input manager for adding and removing car features.
 */
export function CarFeaturesInput({
  features = [],
  onChange,
}: CarFeaturesInputProps) {
  const [featureInput, setFeatureInput] = useState("");

  const handleAddFeature = () => {
    const trimmedFeature = featureInput.trim();
    if (!trimmedFeature) {
      toast.error("Feature cannot be empty");
      return;
    }

    if (features.includes(trimmedFeature)) {
      toast.error("Feature already added");
      return;
    }

    onChange([...features, trimmedFeature]);
    setFeatureInput("");
  };

  const handleRemoveFeature = (index: number) => {
    onChange(features.filter((_, i) => i !== index));
  };

  const handleFeatureKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddFeature();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="features">Features</Label>
      <div className="flex gap-2">
        <Input
          id="features"
          value={featureInput}
          onChange={(e) => setFeatureInput(e.target.value)}
          onKeyDown={handleFeatureKeyPress}
          placeholder="e.g. Bluetooth, Navigation System, Leather Seats"
          suppressHydrationWarning
        />
        <Button
          type="button"
          onClick={handleAddFeature}
          variant="outline"
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {features.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {features.map((feature, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1"
            >
              {feature}
              <button
                type="button"
                onClick={() => handleRemoveFeature(index)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <p className="text-gray-500 text-sm">
        Add features one by one. Press Enter or click + to add.
      </p>
    </div>
  );
}
