"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { FAQ } from "@/types/home-content";

interface SortableFAQItemProps {
  faq: FAQ;
  onEdit: (faq: FAQ) => void;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

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
      className="flex items-start justify-between p-4 border rounded-lg bg-background"
    >
      <div className="flex items-start gap-3 flex-1">
        <button
          className="cursor-grab active:cursor-grabbing mt-1 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="space-y-1 flex-1">
          <h4 className="font-medium">{faq.question}</h4>
          <p className="text-sm text-muted-foreground">{faq.answer}</p>
          <span className="text-xs text-gray-400">Order: {faq.order}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(faq)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-600"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
