"use client";

import { useEffect, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import useFetch from "@/hooks/use-fetch";
import {
  getHomePageContent,
  updateHomePageContent,
  getFAQs,
  addFAQ,
  updateFAQ,
  deleteFAQ,
} from "@/actions/home-content";
import {
  homePageContentSchema,
  faqSchema,
  HomePageContentFormValues,
  FAQFormValues,
} from "@/schemas/home-content";
import { FAQ } from "@/types/home-content";
import { HeroSection } from "./home-content/hero-section";
import { FeaturesSection } from "./home-content/features-section";
import { CTASection } from "./home-content/cta-section";
import { FAQSection } from "./home-content/faq-section";

export const HomeContentForm = () => {
  // --- Home Page Content State ---
  const [initialContent, setInitialContent] =
    useState<HomePageContentFormValues | null>(null);
  const { fn: fetchContent } = useFetch(getHomePageContent);
  const { loading: updatingContent, fn: updateContent } = useFetch(
    updateHomePageContent
  );

  // Separate forms for each section
  const heroForm = useForm<Partial<HomePageContentFormValues>>({
    resolver: zodResolver(homePageContentSchema.partial()),
  });

  const featuresForm = useForm<Partial<HomePageContentFormValues>>({
    resolver: zodResolver(homePageContentSchema.partial()),
  });

  const ctaForm = useForm<Partial<HomePageContentFormValues>>({
    resolver: zodResolver(homePageContentSchema.partial()),
  });

  // --- FAQ State ---
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const { fn: fetchFAQs } = useFetch(getFAQs);
  const { loading: addingFAQ, fn: createFAQ } = useFetch(addFAQ);
  const { loading: updatingFAQ, fn: editFAQ } = useFetch(updateFAQ);
  const { loading: deletingFAQ, fn: removeFAQ } = useFetch(deleteFAQ);

  const [isFAQDialogOpen, setIsFAQDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);

  const faqForm = useForm({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: "",
      answer: "",
      order: 0,
    },
  });

  // --- Effects ---
  useEffect(() => {
    const loadData = async () => {
      // Load Content
      const content = await fetchContent();
      if (content) {
        setInitialContent(content);
        heroForm.reset(content);
        featuresForm.reset(content);
        ctaForm.reset(content);
      }

      // Load FAQs
      const faqList = await fetchFAQs();
      if (faqList) {
        setFaqs(faqList);
      }
    };
    loadData();
  }, [fetchContent, fetchFAQs, heroForm, featuresForm, ctaForm]);

  // --- Handlers ---

  const onHeroSubmit = async (data: Partial<HomePageContentFormValues>) => {
    const res = await updateContent(data);
    if (res?.success) {
      toast.success("Hero section updated");
      if (res.data) setInitialContent(res.data);
    } else {
      toast.error(res?.error || "Failed to update hero section");
    }
  };

  const onFeaturesSubmit = async (data: Partial<HomePageContentFormValues>) => {
    const res = await updateContent(data);
    if (res?.success) {
      toast.success("Features section updated");
      if (res.data) setInitialContent(res.data);
    } else {
      toast.error(res?.error || "Failed to update features section");
    }
  };

  const onCTASubmit = async (data: Partial<HomePageContentFormValues>) => {
    const res = await updateContent(data);
    if (res?.success) {
      toast.success("CTA section updated");
      if (res.data) setInitialContent(res.data);
    } else {
      toast.error(res?.error || "Failed to update CTA section");
    }
  };

  const handleReset = (
    form: UseFormReturn<Partial<HomePageContentFormValues>>
  ) => {
    if (initialContent) {
      form.reset(initialContent);
    }
  };

  const onFAQSubmit = async (data: FAQFormValues) => {
    if (editingFAQ) {
      const res = await editFAQ(editingFAQ.id, data);
      if (res?.success && res.data) {
        setFaqs((prev) =>
          prev.map((f) => (f.id === editingFAQ.id ? res.data! : f))
        );
        toast.success("FAQ updated");
        setIsFAQDialogOpen(false);
        setEditingFAQ(null);
        faqForm.reset();
      }
    } else {
      const res = await createFAQ(data);
      if (res?.success && res.data) {
        setFaqs((prev) => [...prev, res.data!]);
        toast.success("FAQ added");
        setIsFAQDialogOpen(false);
        faqForm.reset();
      }
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    const res = await removeFAQ(id);
    if (res?.success) {
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      toast.success("FAQ deleted");
    } else {
      toast.error(res?.error || "Failed to delete FAQ");
    }
  };

  const openAddFAQ = () => {
    setEditingFAQ(null);
    faqForm.reset({ question: "", answer: "", order: faqs.length + 1 });
    setIsFAQDialogOpen(true);
  };

  const openEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    faqForm.reset({
      question: faq.question,
      answer: faq.answer,
      order: faq.order,
    });
    setIsFAQDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <HeroSection
        form={heroForm}
        onSubmit={onHeroSubmit}
        onReset={() => handleReset(heroForm)}
        isLoading={updatingContent}
      />

      <FeaturesSection
        form={featuresForm}
        onSubmit={onFeaturesSubmit}
        onReset={() => handleReset(featuresForm)}
        isLoading={updatingContent}
      />

      <CTASection
        form={ctaForm}
        onSubmit={onCTASubmit}
        onReset={() => handleReset(ctaForm)}
        isLoading={updatingContent}
      />

      <FAQSection
        faqs={faqs}
        setFaqs={setFaqs}
        onDelete={handleDeleteFAQ}
        onEdit={openEditFAQ}
        onAdd={openAddFAQ}
        isDialogOpen={isFAQDialogOpen}
        setIsDialogOpen={setIsFAQDialogOpen}
        editingFAQ={editingFAQ}
        faqForm={faqForm}
        onFAQSubmit={onFAQSubmit}
        isSubmitting={addingFAQ || updatingFAQ}
        isDeleting={deletingFAQ}
      />
    </div>
  );
};
