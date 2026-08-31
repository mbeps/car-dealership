"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { FAQ } from "@/types/home-content/faq";

interface SortableFAQItemProps {
  /** FAQ record displayed in the sortable list. */
  faq: FAQ;
  /** Callback for editing this FAQ. */
  onEdit: (faq: FAQ) => void;
  /** Callback for deleting this FAQ. */
  onDelete: (id: string) => Promise<void>;
  /** Whether this FAQ is currently being deleted. */
  isDeleting: boolean;
}

/**
 * Reusable sortable FAQ row with inline edit and delete controls.
 * Uses DnD sortable handles and a local edit dialog.
 *
 * @param faq - FAQ record displayed in the sortable list
 * @param onEdit - Callback for editing this FAQ
 * @param onDelete - Callback for deleting this FAQ
 * @param isDeleting - Whether this FAQ is currently being deleted
 * @returns Sortable FAQ list item
 * @see FAQSection - Parent FAQ editor state
 */
export const SortableFAQItem = ({
  faq,
  onEdit,
  onDelete,
  isDeleting,
}: SortableFAQItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start justify-between rounded-lg border bg-background p-4"
    >
      <div className="flex flex-1 items-start gap-3">
        <button
          className="mt-1 cursor-grab touch-none active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1 space-y-1">
          <h4 className="font-medium">{faq.question}</h4>
          <p className="text-muted-foreground text-sm">{faq.answer}</p>
          <span className="text-gray-400 text-xs">Order: {faq.order}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(faq)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600"
                disabled={isDeleting}
              />
            }
          >
            <Trash2 className="h-4 w-4" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                FAQ.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(faq.id)}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
