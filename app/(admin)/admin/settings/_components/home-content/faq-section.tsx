"use client";

import { UseFormReturn } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FAQFormValues } from "@/schemas/home-content";
import { FAQ } from "@/types/home-content/faq";
import { SortableFAQItem } from "./sortable-faq-item";
import { reorderFAQs } from "@/actions/home/reorder-faqs";
import { toast } from "sonner";

interface FAQSectionProps {
  /** FAQ records displayed in the list. */
  faqs: FAQ[];
  /** Callback for replacing FAQ state after mutations. */
  setFaqs: (faqs: FAQ[]) => void;
  /** Callback for deleting a FAQ. */
  onDelete: (id: string) => Promise<void>;
  /** Callback for editing a FAQ. */
  onEdit: (faq: FAQ) => void;
  /** Callback for adding a new FAQ. */
  onAdd: () => void;
  /** Whether the FAQ dialog is open. */
  isDialogOpen: boolean;
  /** Callback for opening or closing the FAQ dialog. */
  setIsDialogOpen: (open: boolean) => void;
  /** FAQ record currently being edited, or null when adding. */
  editingFAQ: FAQ | null;
  /** React Hook Form state for FAQ add/edit dialogs. */
  faqForm: UseFormReturn<FAQFormValues>;
  /** Save callback for FAQ add/edit submissions. */
  onFAQSubmit: (data: FAQFormValues) => Promise<void>;
  /** Whether the FAQ form is currently saving. */
  isSubmitting: boolean;
  /** Whether a FAQ is currently being deleted. */
  isDeleting: boolean;
}

/**
 * Reusable FAQ list editor with add, edit, delete, and drag reorder actions.
 * Optimistically reorders FAQs and falls back on failed server saves.
 *
 * @param faqs - FAQ records displayed in the list
 * @param setFaqs - Callback for replacing FAQ state after mutations
 * @param onDelete - Callback for deleting a FAQ
 * @param onEdit - Callback for editing a FAQ
 * @param onAdd - Callback for adding a new FAQ
 * @param isDialogOpen - Whether the FAQ dialog is open
 * @param setIsDialogOpen - Callback for opening or closing the FAQ dialog
 * @param editingFAQ - FAQ record currently being edited, or null when adding
 * @param faqForm - React Hook Form state for FAQ add/edit dialogs
 * @param onFAQSubmit - Save callback for FAQ add/edit submissions
 * @param isSubmitting - Whether the FAQ form is currently saving
 * @param isDeleting - Whether a FAQ is currently being deleted
 * @returns FAQ editor with drag-and-drop sorting
 * @see reorderFAQs - Server action persisting FAQ order
 * @see SortableFAQItem - Sortable FAQ rows
 */
export const FAQSection = ({
  faqs,
  setFaqs,
  onDelete,
  onEdit,
  onAdd,
  isDialogOpen,
  setIsDialogOpen,
  editingFAQ,
  faqForm,
  onFAQSubmit,
  isSubmitting,
  isDeleting,
}: FAQSectionProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /** Persist optimistic FAQ reordering, reverting if the server action fails. */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = faqs.findIndex((faq) => faq.id === active.id);
    const newIndex = faqs.findIndex((faq) => faq.id === over.id);

    // Optimistically update UI
    const newFaqs = arrayMove(faqs, oldIndex, newIndex);

    // Update order values for all FAQs
    const updatedFaqs = newFaqs.map((faq, index) => ({
      ...faq,
      order: index + 1,
    }));

    setFaqs(updatedFaqs);

    // Calculate updates to persist
    const updates = updatedFaqs.map((faq) => ({
      id: faq.id,
      order: faq.order,
    }));

    // Persist to database
    const result = await reorderFAQs(updates);

    if (!result.success) {
      toast.error(result.error || "Failed to reorder FAQs");
      // Revert on error
      setFaqs(faqs);
      return;
    }

    toast.success("FAQs reordered successfully");
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Manage the FAQs on the home page.</CardDescription>
          </div>
          <Button onClick={onAdd} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add FAQ
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No FAQs found.
              </p>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={faqs.map((faq) => faq.id)}
                strategy={verticalListSortingStrategy}
              >
                {faqs.map((faq) => (
                  <SortableFAQItem
                    key={faq.id}
                    faq={faq}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isDeleting={isDeleting}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFAQ ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
            <DialogDescription>
              {editingFAQ
                ? "Update the question and answer."
                : "Create a new question and answer pair."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={faqForm.handleSubmit(onFAQSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                {...faqForm.register("question")}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">
                {faqForm.watch("question")?.length || 0}/100
              </p>
              {faqForm.formState.errors.question && (
                <p className="text-sm text-red-500">
                  {faqForm.formState.errors.question.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                {...faqForm.register("answer")}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right">
                {faqForm.watch("answer")?.length || 0}/300
              </p>
              {faqForm.formState.errors.answer && (
                <p className="text-sm text-red-500">
                  {faqForm.formState.errors.answer.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
