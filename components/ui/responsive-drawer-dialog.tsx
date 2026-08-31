"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * Props for the ResponsiveDrawerDialog component.
 * Allows configuration of state, trigger, and content details.
 *
 * @see ResponsiveDrawerDialog for usage
 * @author Maruf Bepary
 */
interface ResponsiveDrawerDialogProps {
  /** Whether the dialog is currently open */
  open?: boolean;
  /** Callback invoked when the open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Element that triggers the dialog/drawer when clicked */
  trigger?: React.ReactNode;
  /** Accessible title shown in the header */
  title?: string;
  /** Accessible description shown below the title */
  description?: string;
  /** Main content to display inside the container */
  children: React.ReactNode;
  /** Optional additional CSS classes for the content container */
  className?: string;
}

/**
 * A responsive container that switches between a Dialog and a Drawer.
 * Uses a 768px breakpoint (md) to render a centered Dialog on desktop
 * and a bottom-anchored Drawer on mobile devices.
 * Implements a hydration guard to prevent SSR mismatches.
 *
 * @param props - Configuration and content for the responsive container
 * @returns A viewport-aware modal container
 * @author Maruf Bepary
 */
export function ResponsiveDrawerDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  className,
}: ResponsiveDrawerDialogProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = React.useState(false);

  // ponytail: used to prevent hydration mismatch since useIsMobile relies on window
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent className={cn("px-4 pb-8", className)}>
          <DrawerHeader className="text-left">
            {title && <DrawerTitle>{title}</DrawerTitle>}
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          {children}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}
      <DialogContent className={className}>
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
