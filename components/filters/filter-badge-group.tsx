"use client";

import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterBadgeGroupProps {
  id: string;
  title: string;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClear: () => void;
}

/**
 * Filter category section with title, clear button, and selectable pill badges.
 */
export function FilterBadgeGroup({
  title,
  options,
  selectedValue,
  onSelect,
  onClear,
}: FilterBadgeGroupProps) {
  return (
    <div className="space-y-3">
      <h4 className="flex justify-between font-medium text-sm">
        <span>{title}</span>
        {selectedValue && (
          <button
            type="button"
            className="flex items-center text-gray-600 text-xs"
            onClick={onClear}
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </button>
        )}
      </h4>
      <div className="custom-scrollbar flex max-h-60 flex-wrap gap-2 overflow-y-auto pr-1">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <Badge
              key={option.value}
              variant={isSelected ? "default" : "outline"}
              className={`cursor-pointer px-3 py-1 ${
                isSelected
                  ? "border-blue-200 bg-blue-100 text-blue-900 hover:bg-blue-200"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => onSelect(isSelected ? "" : option.value)}
            >
              {option.label}
              {isSelected && <Check className="ml-1 inline h-3 w-3" />}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
