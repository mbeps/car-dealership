"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { cn } from "@/lib/utils";
import { type ButtonVariants, buttonVariants } from "./button-variants";

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & ButtonVariants) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, type ButtonVariants, buttonVariants };
