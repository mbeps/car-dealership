"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCarSearchUrl } from "@/lib/route/createCarSearchUrl";

/**
 * Renders the homepage search form.
 *
 * @returns Homepage search form that routes to car search results.
 * @see createCarSearchUrl - Helper that builds the search URL.
 */
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
      className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center"
    >
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-500" />
        <Input
          type="text"
          placeholder="Search by make, model, or keyword..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-full border-gray-300 bg-white/95 py-6 pr-20 pl-10 text-base backdrop-blur-sm"
        />
        <Button
          type="submit"
          className="absolute top-1/2 right-2 h-auto -translate-y-1/2 rounded-full px-3 py-3"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
