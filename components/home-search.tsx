"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createCarSearchUrl } from "@/lib/routes";

export function HomeSearch() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleTextSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    router.push(createCarSearchUrl({ search: searchTerm }));
  };

  return (
    <form
      onSubmit={handleTextSearch}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        <Input
          type="text"
          placeholder="Search by make, model, or keyword..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-full border-gray-300 bg-white/95 py-6 pl-10 pr-4 text-base backdrop-blur-sm"
        />
      </div>
      <Button type="submit" className="rounded-full px-8 py-6">
        Search
      </Button>
    </form>
  );
}
