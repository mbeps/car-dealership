"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface NumericRangeFilterProps {
  title: string;
  minId: string;
  maxId: string;
  defaultMin: number;
  defaultMax: number;
  value: number[];
  onChange: (range: number[]) => void;
  unitPrefix?: string;
  unitSuffix?: string;
  formatDisplay?: (val: number) => string;
}

/**
 * Reusable min/max number range input for filters with local input state and onBlur commit.
 */
export function NumericRangeFilter({
  title,
  minId,
  maxId,
  defaultMin,
  defaultMax,
  value,
  onChange,
  unitPrefix,
  unitSuffix,
  formatDisplay = (val) => val.toLocaleString(),
}: NumericRangeFilterProps) {
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");

  // Sync state from props (Derived State Pattern)
  const [prevRange, setPrevRange] = useState(value);
  if (prevRange !== value) {
    setPrevRange(value);
    const isDefault = value[0] === defaultMin && value[1] === defaultMax;
    setMinInput(isDefault ? "" : value[0].toString());
    setMaxInput(isDefault ? "" : value[1].toString());
  }

  const handleInputChange = (index: number, rawValue: string) => {
    const cleanValue = rawValue.replace(/[^0-9]/g, "");
    if (index === 0) {
      setMinInput(cleanValue);
    } else {
      setMaxInput(cleanValue);
    }
  };

  const handleBlur = () => {
    const min = minInput ? parseInt(minInput, 10) : defaultMin;
    const max = maxInput ? parseInt(maxInput, 10) : defaultMax;
    onChange([min, max]);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-medium">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Minimum Input */}
        <div className="space-y-2">
          <Label htmlFor={minId} className="text-gray-600 text-xs">
            Minimum
          </Label>
          <div className="relative">
            {unitPrefix && (
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500 text-sm">
                {unitPrefix}
              </span>
            )}
            <Input
              id={minId}
              type="text"
              inputMode="numeric"
              value={minInput}
              onChange={(e) => handleInputChange(0, e.target.value)}
              onBlur={handleBlur}
              placeholder={defaultMin.toLocaleString()}
              className={
                unitPrefix ? "pl-6" : unitSuffix ? "pr-8 sm:pr-10" : ""
              }
            />
            {unitSuffix && (
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 text-sm">
                {unitSuffix}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs">
            Min: {unitPrefix || ""}
            {formatDisplay(defaultMin)}
            {unitSuffix ? ` ${unitSuffix}` : ""}
          </p>
        </div>

        {/* Maximum Input */}
        <div className="space-y-2">
          <Label htmlFor={maxId} className="text-gray-600 text-xs">
            Maximum
          </Label>
          <div className="relative">
            {unitPrefix && (
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500 text-sm">
                {unitPrefix}
              </span>
            )}
            <Input
              id={maxId}
              type="text"
              inputMode="numeric"
              value={maxInput}
              onChange={(e) => handleInputChange(1, e.target.value)}
              onBlur={handleBlur}
              placeholder={defaultMax.toLocaleString()}
              className={
                unitPrefix ? "pl-6" : unitSuffix ? "pr-8 sm:pr-10" : ""
              }
            />
            {unitSuffix && (
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 text-sm">
                {unitSuffix}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs">
            Max: {unitPrefix || ""}
            {formatDisplay(defaultMax)}
            {unitSuffix ? ` ${unitSuffix}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
